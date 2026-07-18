(function () {
  'use strict';

  // ========== DOM REFS ==========
  var socket = io();
  var welcomeScreen = document.getElementById('welcomeScreen');
  var welcomeForm = document.getElementById('welcomeForm');
  var welcomeNameInput = document.getElementById('welcomeNameInput');
  var welcomeBtn = document.getElementById('welcomeBtn');
  var welcomeError = document.getElementById('welcomeError');
  var app = document.getElementById('app');
  var messageInput = document.getElementById('messageInput');
  var sendBtn = document.getElementById('sendBtn');
  var messagesContainer = document.getElementById('messagesContainer');
  var emptyState = document.getElementById('emptyState');
  var userList = document.getElementById('userList');
  var typingText = document.getElementById('typingText');
  var typingDots = document.getElementById('typingDots');
  var emojiPicker = document.getElementById('emojiPicker');
  var emojiBtn = document.getElementById('emojiBtn');
  var fileBtn = document.getElementById('fileBtn');
  var fileInput = document.getElementById('fileInput');
  var fileUpload = document.getElementById('fileUpload');
  var filePreviewImg = document.getElementById('filePreviewImg');
  var filePreviewName = document.getElementById('filePreviewName');
  var removeFileBtn = document.getElementById('removeFileBtn');
  var connectionDot = document.getElementById('connectionDot');
  var connectionText = document.getElementById('connectionText');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('overlay');
  var mobileMenuBtn = document.getElementById('mobileMenuBtn');
  var audioIncoming = document.getElementById('audioIncoming');
  var chatTitle = document.getElementById('chatTitle');
  var sidebarAvatarText = document.getElementById('sidebarAvatarText');
  var sidebarUsername = document.getElementById('sidebarUsername');
  var logoutBtn = document.getElementById('logoutBtn');

  var currentUser = '';
  var typingTimeout = null;
  var isEmojiOpen = false;
  var pendingFile = null;
  var isAtBottom = true;

  // ========== WELCOME SCREEN ==========
  function enterChat(name) {
    currentUser = name;

    // Update sidebar with user info
    var initials = name.charAt(0).toUpperCase();
    sidebarAvatarText.textContent = initials;
    sidebarUsername.textContent = name;

    // Update header title
    chatTitle.textContent = 'Sala General — ' + name;

    // Hide welcome, show app
    welcomeScreen.style.display = 'none';
    app.style.display = 'flex';

    // Register with server
    socket.emit('chat:name', name);

    // Focus message input
    messageInput.focus();

    // Add system message
    addSystemMessage('Te has unido como ' + name);
  }

  function showWelcomeError(msg) {
    welcomeError.textContent = msg;
    welcomeError.classList.add('visible');
    welcomeNameInput.classList.add('error');
  }

  function hideWelcomeError() {
    welcomeError.classList.remove('visible');
    welcomeNameInput.classList.remove('error');
  }

  welcomeForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = welcomeNameInput.value.trim();
    hideWelcomeError();

    if (!name) {
      showWelcomeError('Por favor ingresa tu nombre');
      welcomeNameInput.focus();
      return;
    }

    if (name.length < 2) {
      showWelcomeError('El nombre debe tener al menos 2 caracteres');
      welcomeNameInput.focus();
      return;
    }

    if (name.length > 30) {
      showWelcomeError('El nombre no puede tener mas de 30 caracteres');
      welcomeNameInput.focus();
      return;
    }

    enterChat(name);
  });

  welcomeNameInput.addEventListener('input', function () {
    hideWelcomeError();
  });

  // ========== LOGOUT ==========
  logoutBtn.addEventListener('click', function () {
    if (currentUser) {
      socket.emit('chat:disconnect', currentUser);
    }
    currentUser = '';
    app.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    welcomeNameInput.value = '';
    welcomeNameInput.disabled = false;
    welcomeNameInput.focus();
    messagesContainer.innerHTML = '';
    emptyState.style.display = 'flex';
    messagesContainer.appendChild(emptyState);
    sidebarUsername.textContent = '';
    sidebarAvatarText.textContent = '';
    chatTitle.textContent = 'Sala General';
  });

  // ========== EMOJIS ==========
  var EMOJIS = [
    '\uD83D\uDE00','\uD83D\uDE01','\uD83D\uDE02','\uD83E\uDD23','\uD83D\uDE03','\uD83D\uDE04','\uD83D\uDE05','\uD83D\uDE06',
    '\uD83D\uDE09','\uD83D\uDE0A','\uD83D\uDE0B','\uD83D\uDE0E','\uD83D\uDE0D','\uD83E\uDD70','\uD83D\uDE18','\uD83D\uDE17',
    '\uD83D\uDE19','\uD83D\uDE1A','\uD83D\uDE42','\uD83E\uDD29','\uD83E\uDD2F','\uD83E\uDD14','\uD83E\uDD28','\uD83D\uDE10',
    '\uD83D\uDE11','\uD83D\uDE36','\uD83D\uDE0F','\uD83D\uDE23','\uD83D\uDE25','\uD83D\uDE24','\uD83D\uDE20','\uD83D\uDE30',
    '\uD83D\uDE2F','\uD83D\uDE2A','\uD83D\uDE2B','\uD83D\uDE34','\uD83D\uDE0C','\uD83D\uDE2C','\uD83D\uDE33','\uD83D\uDE08',
    '\uD83D\uDE31','\uD83D\uDE32','\uD83D\uDE35','\uD83D\uDE37','\uD83E\uDD75','\uD83E\uDD76','\uD83E\uDD7A','\uD83D\uDE12',
    '\u2639\uFE0F','\uD83D\uDE13','\uD83D\uDE1B','\uD83D\uDE14','\uD83D\uDE15','\uD83D\uDE27','\uD83D\uDE28','\uD83D\uDE29',
    '\uD83D\uDE16','\uD83D\uDE26','\uD83D\uDE22','\uD83D\uDE2D','\uD83D\uDE2E','\uD83D\uDE38','\uD83D\uDE39','\uD83D\uDE3A',
    '\uD83D\uDE3B','\uD83D\uDE3C','\uD83D\uDE3D','\uD83D\uDE1C','\uD83E\uDD2E','\uD83D\uDE07','\uD83E\uDD13','\uD83E\uDD17',
    '\uD83E\uDD1D','\uD83D\uDC4D','\uD83D\uDC4E','\uD83D\uDC4A','\u270A','\uD83E\uDD1E','\uD83D\uDC4B','\uD83E\uDD1A',
    '\u270C\uFE0F','\uD83D\uDD96','\uD83E\uDD18','\uD83E\uDD19','\uD83D\uDC48','\uD83D\uDC49','\uD83E\uDD1B','\uD83E\uDD1C',
    '\uD83D\uDE4C','\uD83E\uDD1F','\uD83E\uDD32','\uD83E\uDD25','\uD83D\uDC4C','\uD83D\uDCAA','\u270B','\uD83E\uDD1A',
    '\uD83E\uDD31','\uD83D\uDC4F','\uD83E\uDD1C','\uD83E\uDD1E','\uD83D\uDC46','\uD83D\uDC47','\uD83D\uDC48','\uD83D\uDC49',
    '\uD83E\uDD33','\uD83D\uDC45','\uD83D\uDC42','\uD83E\uDD7B','\uD83D\uDC40','\uD83E\uDD40','\uD83D\uDC43','\uD83E\uDD70',
    '\uD83D\uDC44','\uD83E\uDD7D','\uD83D\uDC46','\uD83D\uDC47','\uD83E\uDD27','\uD83D\uDC4A','\uD83E\uDD34','\uD83D\uDC4B',
    '\uD83E\uDD1A','\uD83D\uDC48','\uD83D\uDC49','\uD83E\uDD1E','\uD83D\uDC4C','\uD83D\uDCAA','\u270B','\uD83E\uDD1A',
    '\uD83E\uDD31','\uD83D\uDC4F','\uD83E\uDD1C','\uD83E\uDD1E','\uD83D\uDC46','\uD83D\uDC47','\uD83D\uDC48','\uD83D\uDC49'
  ];

  EMOJIS.forEach(function (emoji) {
    var btn = document.createElement('button');
    btn.textContent = emoji;
    btn.type = 'button';
    btn.addEventListener('click', function () {
      insertEmoji(emoji);
    });
    emojiPicker.appendChild(btn);
  });

  function insertEmoji(emoji) {
    var cursorPos = messageInput.selectionStart;
    var text = messageInput.value;
    messageInput.value = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
    messageInput.focus();
    messageInput.selectionStart = messageInput.selectionEnd = cursorPos + emoji.length;
  }

  // ========== HELPERS ==========
  function getTimestamp() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function isScrolledToBottom() {
    var threshold = 50;
    return messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < threshold;
  }

  // ========== MESSAGES ==========
  function addMessage(data, type) {
    emptyState.style.display = 'none';

    var msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + (type === 'self' ? 'self' : 'other');

    var meta = document.createElement('div');
    meta.className = 'message-meta';

    var author = document.createElement('span');
    author.className = 'message-author';
    author.textContent = data.username || 'Anonimo';

    var time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = data.time || getTimestamp();

    meta.appendChild(author);
    meta.appendChild(time);

    var bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (data.image) {
      var img = document.createElement('img');
      img.src = data.image;
      img.alt = 'Imagen compartida por ' + (data.username || 'Anonimo');
      img.loading = 'lazy';
      bubble.appendChild(img);
    }

    if (data.message) {
      var textSpan = document.createElement('span');
      textSpan.textContent = data.message;
      bubble.appendChild(textSpan);
    }

    msgDiv.appendChild(meta);
    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);

    if (isScrolledToBottom()) {
      scrollToBottom();
    }
  }

  function addSystemMessage(text) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'message system';

    var bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;

    msgDiv.appendChild(bubble);
    messagesContainer.appendChild(msgDiv);

    if (isScrolledToBottom()) {
      scrollToBottom();
    }
  }

  // ========== SEND ==========
  function sendMessage() {
    var text = messageInput.value.trim();
    if (!text && !pendingFile) return;
    if (!currentUser) return;

    var msgData = {
      username: currentUser,
      message: text,
      time: getTimestamp()
    };

    if (pendingFile) {
      msgData.image = pendingFile;
    }

    socket.emit('chat:message', msgData);
    messageInput.value = '';
    autoResize();

    if (pendingFile) {
      pendingFile = null;
      fileUpload.classList.remove('visible');
    }
  }

  function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  }

  // ========== USER LIST ==========
  function updateUserList(users) {
    userList.innerHTML = '';
    if (!users || users.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'user-list-item';
      empty.style.opacity = '0.5';
      empty.textContent = 'No hay usuarios conectados';
      userList.appendChild(empty);
      return;
    }

    users.forEach(function (name) {
      var li = document.createElement('li');
      li.className = 'user-list-item';

      var avatar = document.createElement('div');
      avatar.className = 'user-status online';

      var span = document.createElement('span');
      span.textContent = name;

      li.appendChild(avatar);
      li.appendChild(span);
      userList.appendChild(li);
    });
  }

  // ========== SOCKET EVENTS ==========
  socket.on('connect', function () {
    connectionDot.className = 'connection-dot connected';
    connectionText.textContent = 'Conectado';

    if (currentUser) {
      socket.emit('chat:name', currentUser);
    }
  });

  socket.on('disconnect', function () {
    connectionDot.className = 'connection-dot disconnected';
    connectionText.textContent = 'Desconectado';
    addSystemMessage('Se perdio la conexion con el servidor');
  });

  socket.on('chat:message', function (data) {
    var isSelf = data.username === currentUser;
    addMessage(data, isSelf ? 'self' : 'other');

    if (!isSelf) {
      audioIncoming.currentTime = 0;
      audioIncoming.play().catch(function () {});
    }
  });

  socket.on('chat:is_online', function (data) {
    addSystemMessage(data);
  });

  socket.on('chat:typing', function (data) {
    if (data !== currentUser) {
      typingText.textContent = data + ' esta escribiendo...';
      typingDots.style.display = 'flex';
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(function () {
        typingText.textContent = '';
        typingDots.style.display = 'none';
      }, 2000);
    }
  });

  socket.on('chat:user_list', function (users) {
    updateUserList(users);
  });

  socket.on('chat:history', function (messages) {
    if (!messages || !messages.length) return;
    messages.forEach(function (msg) {
      var isSelf = msg[0] === currentUser;
      addMessage({ username: msg[0], message: msg[1], image: msg[2], time: msg[3] }, isSelf ? 'self' : 'other');
    });
  });

  socket.on('chat:error', function (msg) {
    addSystemMessage(msg);
  });

  // ========== UI EVENTS ==========
  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  messageInput.addEventListener('input', function () {
    autoResize();
    if (currentUser) {
      socket.emit('chat:typing', currentUser);
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // ========== FILE UPLOAD ==========
  fileBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addSystemMessage('La imagen es demasiado grande (max 5MB)');
      fileInput.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function (ev) {
      pendingFile = ev.target.result;
      filePreviewImg.src = pendingFile;
      filePreviewName.textContent = file.name;
      fileUpload.classList.add('visible');
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  removeFileBtn.addEventListener('click', function () {
    pendingFile = null;
    fileUpload.classList.remove('visible');
  });

  // ========== EMOJI PICKER ==========
  emojiBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    isEmojiOpen = !isEmojiOpen;
    emojiPicker.classList.toggle('open', isEmojiOpen);
    emojiBtn.classList.toggle('active', isEmojiOpen);
  });

  document.addEventListener('click', function () {
    if (isEmojiOpen) {
      isEmojiOpen = false;
      emojiPicker.classList.remove('open');
      emojiBtn.classList.remove('active');
    }
  });

  emojiPicker.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // ========== MOBILE SIDEBAR ==========
  mobileMenuBtn.addEventListener('click', function () {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('visible');
  });

  overlay.addEventListener('click', function () {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('visible');
  });

  // ========== SCROLL DETECTION ==========
  messagesContainer.addEventListener('scroll', function () {
    isAtBottom = isScrolledToBottom();
  });

  // ========== CONNECTION STATUS ==========
  socket.on('reconnect', function () {
    connectionDot.className = 'connection-dot connected';
    connectionText.textContent = 'Conectado';
  });

  socket.on('reconnect_error', function () {
    connectionDot.className = 'connection-dot disconnected';
    connectionText.textContent = 'Error de conexion';
  });

  // ========== CLEANUP ==========
  window.addEventListener('beforeunload', function () {
    if (currentUser) {
      socket.emit('chat:disconnect', currentUser);
    }
  });

  // ========== MIGRATE EMIT FOR USER LIST ==========
  socket.emit('chat:request_users');

})();
