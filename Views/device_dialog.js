var device_dialog =
{
    templates: null,
    deviceType: null,
    device: null,

    'loadConfig':function(templates, device) {
        this.templates = templates;
        
        if (device != null) {
            this.deviceType = device.type;
            this.device = device;
        }
        else {
            this.deviceType = null;
            this.device = null;
        }
        
        this.drawConfig();
        
        // Initialize callbacks
        this.registerConfigEvents();
    },

    'drawConfig':function() {
        
        $("#device-config-modal").modal('show');
        this.adjustConfigModal();
        this.clearConfigModal();

        var out = "";

        var categories = [];
        var devicesByCategory = {};
        for (var id in this.templates) {
            var device = this.templates[id];
            device['id'] = id;
            
            if (devicesByCategory[device.category] == undefined) {
                devicesByCategory[device.category] = [];
                categories.push(device.category);
            }
            devicesByCategory[device.category].push(device);
        }
        // Place OpenEnergyMonitor prominently at first place, while sorting other categories
        if (categories.indexOf('OpenEnergyMonitor') > -1) {
            categories.splice(categories.indexOf('OpenEnergyMonitor'), 1);
            categories.sort()
            categories = ['OpenEnergyMonitor'].concat(categories);
        }
        
        for (var i in categories) {
            var category = categories[i];

            var groups = [];
            var devicesByGroup = {};
            for (var i in devicesByCategory[category]) {
                var group = devicesByCategory[category][i].group;
                if (devicesByGroup[group] == undefined) {
                    devicesByGroup[group] = [];
                    groups.push(group);
                }
                devicesByGroup[group].push(devicesByCategory[category][i]);
            }
            groups.sort();
            
            out += "<tbody>"
            out += "<tr class='category-header' category='"+category+"' style='background-color:#aaa; cursor:pointer'>";
            out += "<td style='font-size:12px; padding:4px; padding-left:8px; font-weight:bold'>"+category+"</td>";
            out += "</tr>";
            out += "</tbody>";
            
            for (var i in groups) {
                var group = groups[i];
                
                out += "<tbody class='group-header' group='"+group+"' category='"+category+"' style='display:none'>"
                out += "<tr style='background-color:#ccc; cursor:pointer'>";
                out += "<td style='font-size:12px; padding:4px; padding-left:16px; font-weight:bold'>"+group+"</td>";
                out += "</tr>";
                out += "</tbody>";
                
                out += "<tbody class='group-body' group='"+group+"' category='"+category+"' style='display:none'>";
                
                for (var i in devicesByGroup[group]) {
                    var id = devicesByGroup[group][i].id;
                    var name = devicesByGroup[group][i].name;
                    if (name.length > 25) {
                        name = name.substr(0, 25) + "...";
                    }
                    
                    out += "<tr class='group-row' type='"+id+"' style='cursor:pointer'>";
                    out += "<td>"+name+"</td>";
                    out += "</tr>";
                }
                out += "</tbody>";    
            }
        }
        $("#template-table").html(out);
        
        if (this.deviceType != null && this.deviceType != '') {
            if (this.templates[this.deviceType]!=undefined) {
                var template = this.templates[this.deviceType]
                
                $(".category-body[category='"+template.category+"']").show();
                $(".group-body[category='"+template.category+"'][group='"+template.group+"']").show();
                $(".group-row[type='"+this.deviceType+"']").addClass("device-selected");
                
                $('#template-description').html('<em style="color:#888">'+template.description+'</em>');
                $('#template-info').show();
            }
        }
    },

    'drawTemplate':function() {
        if (this.deviceType !== null) {
            var template = this.templates[this.deviceType];
            $('#template-description').html('<em style="color:#888">'+template.description+'</em>');
            $('#template-info').show();

            if (template.module == 'muc' && this.device == null) {
                // Append Controllers from database to select
                $.ajax({ url: path+"muc/controller/list.json", dataType: 'json', async: true, success: function(data, textStatus, xhr) {
                    
                    var tooltip = "The communication controller this device should be registered for.";
                    $('#template-options-ctrl-tooltip').attr("title", tooltip).tooltip({html: true});
                    
                    var ctrlSelect = $("#template-options-ctrl-select").empty();
                    ctrlSelect.append("<option selected hidden='true' value=''>Select a controller</option>").val('');
                    $.each(data, function() {
                        ctrlSelect.append($("<option />").val(this.id).text(this.description));
                    });
                    
                    $("#template-options-ctrl").show();
                    $("#template-options").show();
                }});
            }
            else {
                $("#template-options").hide();
                $("#template-options-ctrl").hide();
                $("#template-options-ctrl-select").empty();
            }
            if (template.options) {
            	var that = this;
            	$.ajax({ url: path+"device/template/get.json",
            		dataType: 'json',
            		async: true,
            		data: "device="+template.id,
            		success: function(result) {
            			var table = $("#options-table").empty();
            			result.options.forEach(function(option) {
            				if(option.mandatory) {
            					that.optionInputType(table, option.type, option.key, option.name, option.select, option.description, option.mandatory);
            				} else {
            					$("#template-add-options").append($("<option />").val(option.key).text(option.name));
            				}
            			});
                    	$("#add-option-button").click(function() {
                        	var key = $('#template-add-options option:selected').val();
                        	if(key != "" && $("#"+key+"-row").val() === undefined) {
                        		var option = result.options.find(function(opt) {
                        			return opt.key === key;
                        		});
                        		that.optionInputType(table, option.type, option.key, option.name, option.select, option.description, option.mandatory);
                        	}
                    	});
                    	
                    	$("#template-options").show();
                    	$("#template-options-table").show();
            		}
            	});
            } else {
            	$("#template-options-table").hide();
            }
        }
        else {
            $('#template-description').text('');
            $('#template-info').hide();
            $("#template-options").hide();
            $("#template-options-ctrl").hide();
            $("#template-options-ctrl-select").empty();
        }
    },

    'optionInputType':function(table, type, key, name, select, description, mandatory) {
    	table.append("<tr id='"+key+"-row'><td>" + name + "</td></tr>");
		if(type === 'text') {
			$("#"+key+"-row").append("<td><input id='template-"+key+"-option-text' type='text' class='input-large' /></td>").hide().fadeIn(300);
		} else if(type === 'selection') {
			$("#"+key+"-row").append("<td><select id='template-"+key+"-option-select' class='input-large'></select></td>").hide().fadeIn(300);
            var optSelect = $("#template-"+key+"-option-select").empty();
            optSelect.append("<option selected hidden='true' value=''>Select a "+name+"</option>").val('');
            select.forEach(function(o) {
            	optSelect.append($("<option />").val(o.value).text(o.name));
            });
		} else if(type === 'switch') {
			$("#"+key+"-row").append(
				"<td><div class='checkbox checkbox-slider--b checkbox-slider-info'>" +
        			"<label>" +
        				"<input id='template-"+key+"-option-switch' type='checkbox'><span></span>" +
        			"</label>" +
        		"</div></td>"
	        ).hide().fadeIn(300);
		}
		table.append("<tr><td colspan='3' id='info-"+key+"' style='padding: 8px; display: none; background-color: #ddd'>" + description + "</td></tr>");
		
    	$("#"+key+"-row").focusin(function() {
    		$("#info-"+key).fadeIn(300);
    	});
    	$("#"+key+"-row").focusout(function() {
    		$("#info-"+key).fadeOut(100);
    	});
    	
		if(!mandatory) {
			$("#"+key+"-row").append("<td><a id='remove-"+key+"-option' title='Remove'><i class='icon-trash' style='cursor:pointer'></i></a></td>");
			$("#remove-"+key+"-option").click(function() {
	    		$("#"+key+"-row").fadeOut(500, $("#"+key+"-row").remove());
	    		$("#info-"+key).remove();
	    	});
		} else {
			$("#"+key+"-row").append("<td><a><i class='icon-trash' style='cursor:not-allowed;opacity:0.3'></i></a></td>");
		}
    },
    
    'clearConfigModal':function() {
        $("#template-table").text('');
        
        var tooltip = "Defaults, like inputs and associated feeds will be automaticaly configured together with the device." +
                "<br><br>" +
                "Initializing a device usualy should only be done once on installation.<br>" +
                "If the configuration was already applied, only missing inputs and feeds will be created.";
        
        $('#template-tooltip').attr("title", tooltip).tooltip({html: true});
        
        if (this.device != null) {
            $('#device-config-node').val(this.device.nodeid);
            $('#device-config-name').val(this.device.name);
            $('#device-config-description').val(this.device.description);

            $('#device-config-delete').show();
        }
        else {
            $('#device-config-node').val('');
            $('#device-config-name').val('');
            $('#device-config-description').val('');

            $('#device-config-delete').hide();
        }
        device_dialog.drawTemplate();
    },

    'adjustConfigModal':function() {

        var width = $(window).width();
        var height = $(window).height();
        
        if ($("#device-config-modal").length) {
            var h = height - $("#device-config-modal").position().top - 180;
            $("#device-config-body").height(h);
        }

        $("#content-wrapper").css("transition","0");
        $("#sidebar-wrapper").css("transition","0");
        if (width < 1024) {
            $("#content-wrapper").css("margin-left","0");
            $("#sidebar-wrapper").css("width","0");
            $("#sidebar-open").show();

            $("#content-wrapper").css("transition","0.5s");
            $("#sidebar-wrapper").css("transition","0.5s");
        } else {
            $("#content-wrapper").css("margin-left","250px");
            $("#sidebar-wrapper").css("width","250px");
            $("#sidebar-open").hide();
            $("#sidebar-close").hide();
        }
    },

    'registerConfigEvents':function() {

        $('#template-table .category-header').off('click').on('click', function() {
            var category = $(this).attr("category");
            
            var e = $(".group-header[category='"+category+"']");
            if (e.is(":visible")) {
                $(".group-body[category='"+category+"']").hide();
                e.hide();
            }
            else {
                e.show();

                // If a device is selected and in the category to uncollapse, show and select it
                if (device_dialog.deviceType != null && device_dialog.deviceType != '') {
                    var template = device_dialog.templates[device_dialog.deviceType];
                    if (template && category == template.category) {
                        $(".group-body[category='"+template.category+"'][group='"+template.group+"']").show();
                        $(".group-row[type='"+device_dialog.deviceType+"']").addClass("device-selected");
                    }
                }
            }
        });

        $('#template-table .group-header').off('click').on('click', function() {
            var group = $(this).attr("group");
            var category = $(this).attr("category");
            
            var e = $(".group-body[group='"+group+"'][category='"+category+"']");
            if (e.is(":visible")) {
                e.hide();
            }
            else {
                e.show();

                // If a device is selected and in the category to uncollapse, show and select it
                if (device_dialog.deviceType != null && device_dialog.deviceType != '') {
                    var template = device_dialog.templates[device_dialog.deviceType];
                    if (category == template.category && group == template.group) {
                        $(".group-row[type='"+device_dialog.deviceType+"']").addClass("device-selected");
                    }
                }
            }
        });

        $("#template-table .group-row").off('click').on('click', function () {
            var type = $(this).attr("type");
            
            $(".group-row[type='"+device_dialog.deviceType+"']").removeClass("device-selected");
            if (device_dialog.deviceType !== type) {
                $(this).addClass("device-selected");
                device_dialog.deviceType = type;
            }
            else {
                device_dialog.deviceType = null;
            }
            device_dialog.drawTemplate();
        });

        $("#sidebar-open").off('click').on('click', function () {
            $("#sidebar-wrapper").css("width","250px");
            $("#sidebar-close").show();
        });

        $("#sidebar-close").off('click').on('click', function () {
            $("#sidebar-wrapper").css("width","0");
            $("#sidebar-close").hide();
        });

        $("#device-save").off('click').on('click', function () {

            var node = $('#device-config-node').val();
            var name = $('#device-config-name').val();
            
            if (name && node) {
                var desc = $('#device-config-description').val();
                
                if (device_dialog.device != null) {
                    var fields = {};
                    if (device_dialog.device.nodeid != node) fields['nodeid'] = node;
                    if (device_dialog.device.name != name) fields['name'] = name;
                    if (device_dialog.device.description != desc) fields['description'] = desc;
                    if (device_dialog.device.type != device_dialog.deviceType) {
                        if (device_dialog.deviceType != null) {
                            fields['type'] = device_dialog.deviceType;
                        }
                        else fields['type'] = '';
                    }
                    
                    var result = device.set(device_dialog.device.id, fields);
                    if (typeof result.success !== 'undefined' && !result.success) {
                        alert('Unable to update device fields:\n'+result.message);
                        return false;
                    }
                    update();
                    
                    if (device_dialog.device.type != device_dialog.deviceType
                            && device_dialog.deviceType != null) {
                        
                        var result = device.initTemplate(device_dialog.device.id);
                        if (typeof result.success !== 'undefined' && !result.success) {
                            alert('Unable to initialize device:\n'+result.message);
                            return false;
                        }
                    }
                }
                else {
                    var id = device.create(node, name, desc, device_dialog.deviceType);
                    update();
                    
                    if (id && device_dialog.deviceType != null) {
                        var options = {};
                        options['ctrlid'] = $('#template-options-ctrl-select option:selected').val();
                        
                        $("#options-table").children().each(function() {
                        	var key = this.id.split("-")[0];
                        	if($('#template-'+key+'-option-select').val() != undefined) {
	                        	var value = $('#template-'+key+'-option-select option:selected').val();
	                        	if(value != "") {
	                        		options[key] = value;
	                        	}
                        	} else if($('#template-'+key+'-option-switch').val() != undefined) {
                        		options[key] = $('#template-'+key+'-option-switch').is(':checked');
                        	} else if($('#template-'+key+'-option-text').val() != undefined) {
                        		var value = $('#template-'+key+'-option-text').val();
	                        	if(value != "") {
	                        		options[key] = value;
	                        	}
                        	}
                        });
                        
                        var result = device.initTemplate(id, options);
                        if (typeof result.success !== 'undefined' && !result.success) {
                            alert('Unable to initialize device:\n'+result.message);
                            return false;
                        }
                    }
                }
                $('#device-config-modal').modal('hide');
            }
            else {
                alert('Device needs to be configured first.');
                return false;
            }
        });

        $("#device-delete").off('click').on('click', function () {
            
            $('#device-config-modal').modal('hide');
            
            device_dialog.loadDelete(device_dialog.device, null);
        });
    },

    'loadInit': function(device) {
        this.device = device;
        
        $('#device-init-modal').modal('show');
        $('#device-init-modal-label').html('Initialize Device: <b>'+device.name+'</b>');
        
        // Initialize callbacks
        this.registerInitEvents();
    },

    'registerInitEvents':function() {
        
        $("#device-init-confirm").off('click').on('click', function() {
            var result = device.initTemplate(device_dialog.device.id);

            if (typeof result.success !== 'undefined' && !result.success) {
                alert('Unable to initialize device:\n'+result.message);
                return false;
            }
            $('#device-init-modal').modal('hide');
            
            return true;
        });
    },

    'loadDelete': function(device, tablerow) {
        this.device = device;

        $('#device-delete-modal').modal('show');
        $('#device-delete-modal-label').html('Delete Device: <b>'+device.name+'</b>');
        
        // Initialize callbacks
        this.registerDeleteEvents(tablerow);
    },

    'registerDeleteEvents':function(row) {
        
        $("#device-delete-confirm").off('click').on('click', function() {
            device.remove(device_dialog.device.id);
            if (row != null) {
                table.remove(row);
                update();
            }
            else if (typeof device_dialog.device.inputs != undefined) {
                // If the table row is undefined and an input list exists, the config dialog
                // was opened in the input view and all corresponding inputs will be deleted
                var inputIds = [];
                for (var i in device_dialog.device.inputs) {
                    var inputId = device_dialog.device.inputs[i].id;
                    inputIds.push(parseInt(inputId));
                }
                input.delete_multiple(inputIds);
            }
            $('#device-delete-modal').modal('hide');
        });
    }
}
