function init() {

  var serverBaseUrl = document.domain;
  var socket = io.connect(serverBaseUrl);
  var sessionId = '';
  function updateParticipants(participants) {
    $('#participants').html('');
    for (var i = 0; i < participants.length; i++) {
      $('#participants').append('<span id="' + participants[i].id + '">' +
        participants[i].name + ' ' + (participants[i].id === sessionId ? '(You)' : '') + '<br /></span>');
    }
  }

  socket.on('connect', function () {
    sessionId = socket.io.engine.id;
    console.log('Connected ' + sessionId);
    socket.emit('newUser', { id: sessionId, name: $('#name').val() });
  });

  socket.on('newConnection', function (data) {
    updateParticipants(data.participants);
  });

  socket.on('userDisconnected', function (data) {
    $('#' + data.id).remove();
  });

  socket.on('nameChanged', function (data) {
    $('#' + data.id).html(data.name + ' ' + (data.id === sessionId ? '(You)' : '') + '<br />');
  });

  socket.on('incomingMessage', function (data) {
    var message = data.message;
    var name = data.name;
    let msg = ``;
    console.log(`${sessionId} == ${data}`)
    if (sessionId == data.sessionId) {
      msg = `<div class="media media-chat media-chat-reverse">
              <div class="media-body">
                  <p>${message}</p>
              </div>
          </div>`;
    } else {
      msg = `<div class="media media-chat">
                <img class="avatar" src="https://avatars.githubusercontent.com/u/28754335?s=60&v=4"
                    alt="...">
                <div class="media-body">
                    <p>${message}</p>
                    <span class="user-name">
                        @${name}
                    </span>
                </div>
            </div>`
    }
    $('#chat-content').append(msg);
    $("#chat-content").animate({ scrollTop: $('#chat-content').prop("scrollHeight") }, 1000);
  });

  socket.on('error', function (reason) {
    console.log('Unable to connect to server', reason);
  });

  function sendMessage() {
    var outgoingMessage = $('#outgoingMessage').val();
    var name = $('#name').val();
    $.ajax({
      url: '/message',
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify({ message: outgoingMessage, name: name, sessionId: sessionId })
    });
    $('#outgoingMessage').val('');
  }

  function outgoingMessageKeyDown(event) {
    if (event.which == 13) {
      event.preventDefault();
      if ($('#outgoingMessage').val().trim().length <= 0) {
        return;
      }
      sendMessage();
      $('#outgoingMessage').val('');
    }
  }

  function outgoingMessageKeyUp() {
    var outgoingMessageValue = $('#outgoingMessage').val();
    $('#send').attr('disabled', (outgoingMessageValue.trim()).length > 0 ? false : true);
  }

  function nameFocusOut() {
    var name = $('#name').val();
    socket.emit('nameChange', { id: sessionId, name: name });
  }

  $('#outgoingMessage').on('keydown', outgoingMessageKeyDown);
  $('#outgoingMessage').on('keyup', outgoingMessageKeyUp);
  $('#name').on('focusout', nameFocusOut);
  $('#send').on('click', sendMessage);

}

$(document).on('ready', init);
