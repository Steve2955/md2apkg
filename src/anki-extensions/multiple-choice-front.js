var checks;
var interval;

// Wait for the DOM to be loaded (I know this is very hacky, but it works ... DOMContentLoaded is not supported)
setTimeout(initMC, 50);

function initMC(){
    // Check if persistent storage is available
    if (Persistence.isAvailable()) {
        // distinguish between back and front of the card
        back = Persistence.getItem("back");
        if(!back){ // FRONT
            // add change listener to all checkboxes
            var inputs = document.getElementsByTagName("input");
            for(var i = 0; i < inputs.length; i++) {
                if(inputs[i].type == "checkbox") inputs[i].addEventListener('change', storeChecks);
            }
            Persistence.setItem("back", true);
        }else{ // BACK
            restoreChecks();
            // Clear all saved key-value pairs
            Persistence.clear();
        }
    }
}

// Save the current state of all checkboxes
function storeChecks(){
    var inputs = document.getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type == "checkbox") Persistence.setItem(inputs[i].id, inputs[i].checked); 
    }
}

// Restore the state of all saved checkboxes
function restoreChecks(){
    var inputs = document.getElementsByTagName("input");
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type == "checkbox"){
            inputs[i].checked = Persistence.getItem(inputs[i].id) == null ? inputs[i].checked: Persistence.getItem(inputs[i].id);
        }
    }
}

