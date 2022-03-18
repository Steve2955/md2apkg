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
            compareChecks();
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

function compareChecks(){
    var inputs = document.getElementsByTagName("input");
    var correct = 0;
    var failed = 0;
    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type == "checkbox"){
            // text of the first checkbox
            var answerI = inputs[i].labels[0].innerText;
            // look for the corresponding checkbox in the other side
            for(var k = i+1; k < inputs.length; k++) {
                // skip none chechbox inputs
                if(inputs[k].type != "checkbox") continue;
                // text of the second checkbox
                var answerK = inputs[k].labels[0].innerText;
                // check if both checkboxes have the same text
                if(answerI === answerK){
                    // do the checkboxes match?
                    if(inputs[i].checked === inputs[k].checked){
                        inputs[i].classList.add('correct');
                        correct++;
                    }else{
                        inputs[i].classList.add('failed');
                        failed++;
                    }
                }
            }
        }
    }
    // show the result as percentage
    var result = document.createElement("h2");
    var overlay = document.getElementById("overlay");
    if(failed == 0){
        result.classList.add("success");
        overlay.classList.add("success");
    }else{
        result.classList.add("failed");
        overlay.classList.add("failed");
    }
    result.innerText = parseInt((correct/(failed+correct))*100) + " %";
    document.getElementById("qa").appendChild(result);
}

