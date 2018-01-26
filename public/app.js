(function() {
  
    var $button, $form

    // ----------------------------------------------------
    // Show a message
    // ----------------------------------------------------
    function showMessage(msg, cl) {
        var $el = document.getElementById('message')
        $el.style.display = 'block'
        $el.innerHTML = msg
        if (cl) $el.classList.add(cl)
    }

    function postData(params, callback) {
      var r = new XMLHttpRequest()
      r.open("POST", "/new", true)
      r.setRequestHeader('Content-Type', 'application/json')
      r.onreadystatechange = function () {
        if (r.readyState != 4 || r.status != 200) return
        callback(JSON.parse(r.responseText))
      }
      r.send(JSON.stringify(params))
    }

    var app = {
      run: function() {
        $button = document.getElementById('send')
        $form = document.getElementById('frm')

        $form.addEventListener('submit', (e)=> e.preventDefault())
        $button.addEventListener('click', app.submit)
      },

      submit: function(e) {
        e.preventDefault()

        var params = {
          fromAddress: document.getElementById('fromAddress').value,
          toAddress: []
        }

        var to = document.getElementsByClassName('toAddress')
        for (var i = 0; i < to.length; i++) {
          if (to[i].value !== "") {
            params.toAddress.push(to[i].value)
          }
        }

        if (!params.fromAddress) {
          showMessage("Missing source address", "error")
          return
        }

        if (params.toAddress.length == 0) {
          showMessage("You must enter at least one destination address", "error")
          return
        }

        postData(params, function(data) {
          if (data.success) {
            var message = "Your mixer request was successful." 
                        + " Please send your jobcoins to address <i>Mixer</i> at <a href='https://jobcoin.gemini.com/hazy'>https://jobcoin.gemini.com/hazy</a>"
            showMessage(message, "success")
          } else {
            showMessage("Error: " + data.error, "error")
          }
        })

      }
    }


    window.app = app

})()
