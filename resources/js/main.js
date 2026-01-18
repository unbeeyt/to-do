// Data Migration System
var DataMigrator = {
  VERSION: '2.0',
  
  // Detect old data format
  detectOldFormat: function(data) {
    if (!data) return null;
    
    // V1.0: Simple todo/completed arrays
    if ((data.todo || data.completed) && !data.boards) {
      return '1.0';
    }
    
    // Check if boards exist but missing version info
    if (data.boards && !data.version) {
      return '1.5';
    }
    
    return null;
  },
  
  // Migrate from V1.0 to V2.0
  migrateFromV1: function(oldData) {
    return {
      version: DataMigrator.VERSION,
      boards: [{
        name: 'Default',
        id: 1,
        todo: oldData.todo || [],
        completed: oldData.completed || []
      }],
      currentBoardId: 1,
      nextBoardId: 2
    };
  },
  
  // Migrate from V1.5 to V2.0
  migrateFromV1_5: function(oldData) {
    return {
      version: DataMigrator.VERSION,
      boards: oldData.boards || [],
      currentBoardId: oldData.currentBoardId || 1,
      nextBoardId: oldData.nextBoardId || 2
    };
  },
  
  // Main migration function
  migrate: function(oldData) {
    var version = this.detectOldFormat(oldData);
    
    if (!version) return null;
    
    var migratedData = null;
    
    if (version === '1.0') {
      migratedData = this.migrateFromV1(oldData);
    } else if (version === '1.5') {
      migratedData = this.migrateFromV1_5(oldData);
    }
    
    if (migratedData) {
      migratedData.migrationDate = new Date().toISOString();
      migratedData.migratedFrom = version;
    }
    
    return migratedData;
  },
  
  // Get migration report
  getMigrationReport: function(oldData, newData) {
    var oldTodoCount = oldData.todo ? oldData.todo.length : 0;
    var oldCompletedCount = oldData.completed ? oldData.completed.length : 0;
    var oldBoardCount = oldData.boards ? oldData.boards.length : 1;
    
    var newTodoCount = newData.boards.reduce((sum, b) => sum + (b.todo ? b.todo.length : 0), 0);
    var newCompletedCount = newData.boards.reduce((sum, b) => sum + (b.completed ? b.completed.length : 0), 0);
    
    return {
      oldFormat: DataMigrator.detectOldFormat(oldData),
      oldStats: {
        tasks: oldTodoCount,
        completed: oldCompletedCount,
        boards: oldBoardCount
      },
      newStats: {
        tasks: newTodoCount,
        completed: newCompletedCount,
        boards: newData.boards.length
      },
      success: (newTodoCount + newCompletedCount) === (oldTodoCount + oldCompletedCount)
    };
  }
};

// Helper functions for cookies

function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (encodeURIComponent(value) || "")  + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
  }
  return null;
}

// Initialize theme from localStorage
var theme = localStorage.getItem('theme') || 'light';
if (theme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('themeToggle').checked = true;
}

var data = (function() {
  var stored = localStorage.getItem('todoList');
  if (stored) {
    var parsed = JSON.parse(stored);
    // Migrate old data format to new board format
    if (parsed.boards) {
      return parsed;
    } else if (parsed.todo || parsed.completed) {
      // Old format - convert to new format
      return {
        boards: [{
          name: 'Default',
          id: 1,
          todo: parsed.todo || [],
          completed: parsed.completed || []
        }],
        currentBoardId: 1,
        nextBoardId: 2
      };
    }
  }
  
  var cookieData = getCookie('todoList');
  if (cookieData) {
    var parsed = JSON.parse(cookieData);
    if (parsed.boards) {
      return parsed;
    } else if (parsed.todo || parsed.completed) {
      return {
        boards: [{
          name: 'Default',
          id: 1,
          todo: parsed.todo || [],
          completed: parsed.completed || []
        }],
        currentBoardId: 1,
        nextBoardId: 2
      };
    }
  }
  
  return {
    boards: [{ name: 'Default', id: 1, todo: [], completed: [] }],
    currentBoardId: 1,
    nextBoardId: 2
  };
})();

var currentBoardId = data.currentBoardId;

// Remove and complete icons in SVG format
var removeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect class="noFill" width="22" height="22"/><g><g><path class="fill" d="M16.1,3.6h-1.9V3.3c0-1.3-1-2.3-2.3-2.3h-1.7C8.9,1,7.8,2,7.8,3.3v0.2H5.9c-1.3,0-2.3,1-2.3,2.3v1.3c0,0.5,0.4,0.9,0.9,1v10.5c0,1.3,1,2.3,2.3,2.3h8.5c1.3,0,2.3-1,2.3-2.3V8.2c0.5-0.1,0.9-0.5,0.9-1V5.9C18.4,4.6,17.4,3.6,16.1,3.6z M9.1,3.3c0-0.6,0.5-1.1,1.1-1.1h1.7c0.6,0,1.1,0.5,1.1,1.1v0.2H9.1V3.3z M16.3,18.7c0,0.6-0.5,1.1-1.1,1.1H6.7c-0.6,0-1.1-0.5-1.1-1.1V8.2h10.6V18.7z M17.2,7H4.8V5.9c0-0.6,0.5-1.1,1.1-1.1h10.2c0.6,0,1.1,0.5,1.1,1.1V7z"/></g><g><g><path class="fill" d="M11,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6s0.6,0.3,0.6,0.6v6.8C11.6,17.7,11.4,18,11,18z"/></g><g><path class="fill" d="M8,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C8.7,17.7,8.4,18,8,18z"/></g><g><path class="fill" d="M14,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C14.6,17.7,14.3,18,14,18z"/></g></g></g></svg>';
var completeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect y="0" class="noFill" width="22" height="22"/><g><path class="fill" d="M9.7,14.4L9.7,14.4c-0.2,0-0.4-0.1-0.5-0.2l-2.7-2.7c-0.3-0.3-0.3-0.8,0-1.1s0.8-0.3,1.1,0l2.1,2.1l4.8-4.8c0.3-0.3,0.8-0.3,1.1,0s0.3,0.8,0,1.1l-5.3,5.3C10.1,14.3,9.9,14.4,9.7,14.4z"/></g></svg>';

// Get current board
function getCurrentBoard() {
  return data.boards.find(b => b.id === currentBoardId) || data.boards[0];
}

renderBoardTabs();
renderTodoList();

// Theme toggle
document.getElementById('themeToggle').addEventListener('change', function() {
  if (this.checked) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
});

// Board management
document.getElementById('addBoard').addEventListener('click', function() {
  var name = document.getElementById('newBoard').value;
  if (name) {
    addBoard(name);
  }
});

document.getElementById('newBoard').addEventListener('keydown', function(e) {
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && this.value) {
    addBoard(this.value);
  }
});

function addBoard(name) {
  var newBoard = {
    name: name,
    id: data.nextBoardId++,
    todo: [],
    completed: []
  };
  data.boards.push(newBoard);
  currentBoardId = newBoard.id;
  data.currentBoardId = currentBoardId;
  dataObjectUpdated();
  document.getElementById('newBoard').value = '';
  renderBoardTabs();
  renderTodoList();
}

function deleteBoard(boardId) {
  if (data.boards.length <= 1) {
    alert('You must have at least one board!');
    return;
  }
  data.boards = data.boards.filter(b => b.id !== boardId);
  if (currentBoardId === boardId) {
    currentBoardId = data.boards[0].id;
    data.currentBoardId = currentBoardId;
  }
  dataObjectUpdated();
  renderBoardTabs();
  renderTodoList();
}

function switchBoard(boardId) {
  currentBoardId = boardId;
  data.currentBoardId = boardId;
  dataObjectUpdated();
  renderBoardTabs();
  renderTodoList();
}

function renderBoardTabs() {
  var boardTabs = document.getElementById('boardTabs');
  boardTabs.innerHTML = '';
  
  for (var i = 0; i < data.boards.length; i++) {
    var board = data.boards[i];
    var tab = document.createElement('button');
    tab.className = 'board-tab' + (board.id === currentBoardId ? ' active' : '');
    tab.innerHTML = board.name;
    
    var deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-board';
    deleteBtn.innerHTML = '×';
    deleteBtn.onclick = (function(id) {
      return function(e) {
        e.stopPropagation();
        if (confirm('Delete this board?')) {
          deleteBoard(id);
        }
      };
    })(board.id);
    
    tab.appendChild(deleteBtn);
    tab.onclick = (function(id) {
      return function() {
        switchBoard(id);
      };
    })(board.id);
    
    boardTabs.appendChild(tab);
  }
}

// User clicked on the add button
// If there is any text inside the item field, add that text to the todo list
document.getElementById('add').addEventListener('click', function() {
  var value = document.getElementById('item').value;
  if (value) {
    addItem(value);
  }
});

document.getElementById('item').addEventListener('keydown', function (e) {
  var value = this.value;
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && value) {
    addItem(value);
  }
});

function addItem (value) {
  var board = getCurrentBoard();
  var recurrence = document.getElementById('recurrence').value;
  var priority = document.getElementById('priority').value;
  var status = document.getElementById('status').value;
  
  var todoItem = {
    text: value,
    recurrence: recurrence,
    priority: priority !== 'none' ? priority : null,
    status: status !== 'none' ? status : null,
    createdDate: new Date().toISOString()
  };
  
  addItemToDOM(todoItem);
  document.getElementById('item').value = '';
  document.getElementById('recurrence').value = 'none';
  document.getElementById('priority').value = 'none';
  document.getElementById('status').value = 'none';

  board.todo.push(todoItem);
  dataObjectUpdated();
}

function renderTodoList() {
  var board = getCurrentBoard();

  // Always clear existing items
  document.getElementById('todo').innerHTML = '';
  document.getElementById('completed').innerHTML = '';

  if (!board.todo.length && !board.completed.length) return;

  for (var i = 0; i < board.todo.length; i++) {
    var item = board.todo[i];
    addItemToDOM(item);
  }

  for (var j = 0; j < board.completed.length; j++) {
    var item = board.completed[j];
    addItemToDOM(item, true);
  }
}

function dataObjectUpdated() {
  localStorage.setItem('todoList', JSON.stringify(data));
  setCookie('todoList', JSON.stringify(data), 30); // 30 Tage gültig
}

function removeItem() {
  var board = getCurrentBoard();
  var item = this.parentNode.parentNode;
  var parent = item.parentNode;
  var id = parent.id;
  var itemText = item.getAttribute('data-item-text');

  if (id === 'todo') {
    board.todo = board.todo.filter(t => (typeof t === 'string' ? t : t.text) !== itemText);
  } else {
    board.completed = board.completed.filter(t => (typeof t === 'string' ? t : t.text) !== itemText);
  }
  dataObjectUpdated();

  parent.removeChild(item);
}

function completeItem() {
  var board = getCurrentBoard();
  var item = this.parentNode.parentNode;
  var parent = item.parentNode;
  var id = parent.id;
  var itemText = item.getAttribute('data-item-text');
  var recurrence = item.getAttribute('data-recurrence');

  // Find the item
  var todoItem = null;
  if (id === 'todo') {
    todoItem = board.todo.find(t => (typeof t === 'string' ? t : t.text) === itemText);
    board.todo = board.todo.filter(t => (typeof t === 'string' ? t : t.text) !== itemText);
    board.completed.push(todoItem || itemText);
  } else {
    todoItem = board.completed.find(t => (typeof t === 'string' ? t : t.text) === itemText);
    board.completed = board.completed.filter(t => (typeof t === 'string' ? t : t.text) !== itemText);
    board.todo.push(todoItem || itemText);
  }

  // If recurring and was completed, create new instance
  if (recurrence && recurrence !== 'none' && id === 'todo') {
    var newItem = {
      text: itemText,
      recurrence: recurrence,
      createdDate: new Date().toISOString()
    };
    board.todo.push(newItem);
  }

  dataObjectUpdated();
  
  // Re-render to update button text
  renderTodoList();
}

// Adds a new item to the todo list
function addItemToDOM(item, completed) {
  var list = (completed) ? document.getElementById('completed'):document.getElementById('todo');

  var itemText = typeof item === 'string' ? item : item.text;
  var recurrence = typeof item === 'string' ? 'none' : (item.recurrence || 'none');
  var priority = typeof item === 'string' ? null : (item.priority || null);
  var status = typeof item === 'string' ? null : (item.status || null);

  var li = document.createElement('li');
  li.setAttribute('data-item-text', itemText);
  li.setAttribute('data-recurrence', recurrence);
  if (priority) li.setAttribute('data-priority', priority);
  if (status) li.setAttribute('data-status', status);
  li.innerText = itemText;

  // Add recurrence badge
  if (recurrence !== 'none') {
    var badge = document.createElement('span');
    badge.className = 'recurrence-badge';
    badge.innerText = recurrence.charAt(0).toUpperCase() + recurrence.slice(1);
    li.appendChild(badge);
  }

  // Add priority tag badge
  if (priority) {
    var priorityBadge = document.createElement('span');
    priorityBadge.className = 'tag-badge priority-' + priority;
    priorityBadge.innerText = 'P: ' + priority.charAt(0).toUpperCase() + priority.slice(1);
    li.appendChild(priorityBadge);
  }

  // Add status tag badge
  if (status) {
    var statusBadge = document.createElement('span');
    statusBadge.className = 'tag-badge status-' + status;
    statusBadge.innerText = status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    li.appendChild(statusBadge);
  }

  var buttons = document.createElement('div');
  buttons.classList.add('buttons');

  var edit = document.createElement('button');
  edit.classList.add('edit');
  edit.innerHTML = '✎';
  edit.addEventListener('click', function(e) {
    e.stopPropagation();
    var editPriority = li.getAttribute('data-priority');
    var editStatus = li.getAttribute('data-status');
    openEditModal(itemText, recurrence, editPriority, editStatus);
  });

  var move = document.createElement('button');
  move.classList.add('move');
  move.innerHTML = '↦';
  move.addEventListener('click', function(e) {
    e.stopPropagation();
    openMoveModal(itemText);
  });

  var done = document.createElement('button');
  done.classList.add('done-btn');
  done.innerHTML = completed ? 'Undone' : 'Done';
  done.addEventListener('click', completeItem);

  var deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.innerHTML = 'Delete';
  deleteBtn.addEventListener('click', removeItem);

  buttons.appendChild(edit);
  buttons.appendChild(move);
  buttons.appendChild(done);
  buttons.appendChild(deleteBtn);
  li.appendChild(buttons);

  list.insertBefore(li, list.childNodes[0]);
}

// Modal Functions
var currentEditingTask = null;

function openEditModal(taskText, recurrence, priority, status) {
  currentEditingTask = taskText;
  document.getElementById('editTaskText').value = taskText;
  document.getElementById('editRecurrence').value = recurrence;
  document.getElementById('editPriority').value = priority || 'none';
  document.getElementById('editStatus').value = status || 'none';
  document.getElementById('editModal').classList.add('show');
}

function openMoveModal(taskText) {
  currentEditingTask = taskText;
  var moveSelect = document.getElementById('moveToBoard');
  moveSelect.innerHTML = '';
  
  for (var i = 0; i < data.boards.length; i++) {
    var board = data.boards[i];
    if (board.id !== currentBoardId) {
      var option = document.createElement('option');
      option.value = board.id;
      option.text = board.name;
      moveSelect.appendChild(option);
    }
  }
  
  document.getElementById('moveModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  currentEditingTask = null;
}

function editTask(newText, newRecurrence, newPriority, newStatus) {
  var board = getCurrentBoard();
  var todoItem = null;
  var itemIndex = -1;
  
  // Find item in todo list
  for (var i = 0; i < board.todo.length; i++) {
    var item = board.todo[i];
    var itemText = typeof item === 'string' ? item : item.text;
    if (itemText === currentEditingTask) {
      todoItem = item;
      itemIndex = i;
      break;
    }
  }
  
  // Find item in completed list if not in todo
  if (itemIndex === -1) {
    for (var j = 0; j < board.completed.length; j++) {
      var item = board.completed[j];
      var itemText = typeof item === 'string' ? item : item.text;
      if (itemText === currentEditingTask) {
        todoItem = item;
        itemIndex = j;
        break;
      }
    }
  }
  
  if (todoItem) {
    if (typeof todoItem === 'string') {
      // Old format - convert to new
      todoItem = { text: todoItem, recurrence: 'none', createdDate: new Date().toISOString() };
    }
    todoItem.text = newText;
    todoItem.recurrence = newRecurrence;
    todoItem.priority = newPriority !== 'none' ? newPriority : null;
    todoItem.status = newStatus !== 'none' ? newStatus : null;
    
    dataObjectUpdated();
    renderTodoList();
  }
}

function moveTask(targetBoardId) {
  var board = getCurrentBoard();
  var targetBoard = data.boards.find(b => b.id === targetBoardId);
  
  if (!targetBoard) return;
  
  // Find and remove from current board
  var todoItem = null;
  
  for (var i = 0; i < board.todo.length; i++) {
    var item = board.todo[i];
    var itemText = typeof item === 'string' ? item : item.text;
    if (itemText === currentEditingTask) {
      todoItem = item;
      board.todo.splice(i, 1);
      break;
    }
  }
  
  if (!todoItem) {
    for (var j = 0; j < board.completed.length; j++) {
      var item = board.completed[j];
      var itemText = typeof item === 'string' ? item : item.text;
      if (itemText === currentEditingTask) {
        todoItem = item;
        board.completed.splice(j, 1);
        break;
      }
    }
  }
  
  // Add to target board
  if (todoItem) {
    var targetList = j !== undefined ? targetBoard.completed : targetBoard.todo;
    targetList.push(todoItem || currentEditingTask);
  }
  
  dataObjectUpdated();
  renderTodoList();
}

// Modal Event Listeners
document.getElementById('saveEditBtn').addEventListener('click', function() {
  var newText = document.getElementById('editTaskText').value;
  var newRecurrence = document.getElementById('editRecurrence').value;
  var newPriority = document.getElementById('editPriority').value;
  var newStatus = document.getElementById('editStatus').value;
  if (newText) {
    editTask(newText, newRecurrence, newPriority, newStatus);
    closeModal('editModal');
  }
});

document.getElementById('confirmMoveBtn').addEventListener('click', function() {
  var targetBoardId = parseInt(document.getElementById('moveToBoard').value);
  if (targetBoardId) {
    moveTask(targetBoardId);
    closeModal('moveModal');
  }
});

// Close modals when clicking X
document.querySelectorAll('.close').forEach(function(closeBtn) {
  closeBtn.addEventListener('click', function() {
    this.parentElement.parentElement.classList.remove('show');
    currentEditingTask = null;
  });
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  var editModal = document.getElementById('editModal');
  var moveModal = document.getElementById('moveModal');
  var migrationModal = document.getElementById('migrationModal');
  
  if (event.target === editModal) {
    editModal.classList.remove('show');
    currentEditingTask = null;
  }
  if (event.target === moveModal) {
    moveModal.classList.remove('show');
    currentEditingTask = null;
  }
  if (event.target === migrationModal) {
    migrationModal.classList.remove('show');
  }
});

// Migration Modal Handlers
document.getElementById('closeMigrationBtn').addEventListener('click', function() {
  document.getElementById('migrationModal').classList.remove('show');
});

document.getElementById('startMigrationBtn').addEventListener('click', function() {
  performMigration();
});

// Check for old data and show migration option
function checkForOldData() {
  var stored = localStorage.getItem('todoList');
  var cookieData = null;
  
  if (!stored) {
    var nameEQ = 'todoList=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) {
        cookieData = decodeURIComponent(c.substring(nameEQ.length, c.length));
        break;
      }
    }
    stored = cookieData;
  }
  
  if (stored) {
    try {
      var parsed = JSON.parse(stored);
      var oldVersion = DataMigrator.detectOldFormat(parsed);
      
      if (oldVersion) {
        showMigrationPrompt(parsed, oldVersion);
      }
    } catch (e) {
      console.log('Could not parse stored data');
    }
  }
}

function showMigrationPrompt(oldData, version) {
  var modal = document.getElementById('migrationModal');
  var message = document.getElementById('migrationMessage');
  var details = document.getElementById('migrationDetails');
  var detailsInfo = document.getElementById('migrationInfo');
  var startBtn = document.getElementById('startMigrationBtn');
  
  message.innerHTML = 'Old data format detected (v' + version + ')! Would you like to migrate to the latest version?';
  
  var oldTodoCount = oldData.todo ? oldData.todo.length : 0;
  var oldCompletedCount = oldData.completed ? oldData.completed.length : 0;
  
  detailsInfo.innerHTML = '<strong>Found:</strong><br>' +
    '• ' + oldTodoCount + ' incomplete tasks<br>' +
    '• ' + oldCompletedCount + ' completed tasks';
  
  details.style.display = 'block';
  startBtn.style.display = 'block';
  
  modal.classList.add('show');
  
  // Store old data for migration
  window.pendingMigrationData = oldData;
}

function performMigration() {
  if (!window.pendingMigrationData) return;
  
  var oldData = window.pendingMigrationData;
  var newData = DataMigrator.migrate(oldData);
  
  if (newData) {
    var report = DataMigrator.getMigrationReport(oldData, newData);
    
    if (report.success) {
      // Save migrated data
      localStorage.setItem('todoList', JSON.stringify(newData));
      setCookie('todoList', JSON.stringify(newData), 30);
      
      // Update current data
      data = newData;
      
      // Show success message
      var message = document.getElementById('migrationMessage');
      var details = document.getElementById('migrationDetails');
      var startBtn = document.getElementById('startMigrationBtn');
      
      message.innerHTML = '<strong style="color: #388e3c;">Migration Successful!</strong><br>' +
        'Your data has been migrated to version ' + DataMigrator.VERSION;
      
      var successInfo = 'Tasks: ' + report.oldStats.tasks + ' → ' + report.newStats.tasks + '<br>' +
        'Completed: ' + report.oldStats.completed + ' → ' + report.newStats.completed + '<br>' +
        'Boards: ' + report.oldStats.boards + ' → ' + report.newStats.boards;
      
      document.getElementById('migrationInfo').innerHTML = successInfo;
      startBtn.style.display = 'none';
      
      // Refresh UI
      setTimeout(function() {
        location.reload();
      }, 2000);
    } else {
      var message = document.getElementById('migrationMessage');
      message.innerHTML = '<strong style="color: #d32f2f;">Migration failed!</strong><br>Not all data was transferred correctly.';
    }
  }
}

// Check for old data on page load
setTimeout(checkForOldData, 500);

// ========== IMPORT/EXPORT FUNCTIONALITY ==========

// Export to JSON
function exportToJSON() {
  var dataToExport = {
    version: data.version || '2.0',
    exportDate: new Date().toISOString(),
    boards: data.boards
  };
  
  var jsonString = JSON.stringify(dataToExport, null, 2);
  downloadFile(jsonString, 'todo-data-' + new Date().toISOString().split('T')[0] + '.json', 'application/json');
}

// Export to CSV
function exportToCSV() {
  var csv = 'Board,Task,Priority,Status,Recurrence,Type\n';
  
  for (var i = 0; i < data.boards.length; i++) {
    var board = data.boards[i];
    
    // Incomplete tasks
    for (var j = 0; j < board.todo.length; j++) {
      var item = board.todo[j];
      var itemText = typeof item === 'string' ? item : item.text;
      var priority = typeof item === 'string' ? '' : (item.priority || '');
      var status = typeof item === 'string' ? '' : (item.status || '');
      var recurrence = typeof item === 'string' ? '' : (item.recurrence || '');
      
      csv += escapeCSV(board.name) + ',' + escapeCSV(itemText) + ',' + priority + ',' + status + ',' + recurrence + ',Todo\n';
    }
    
    // Completed tasks
    for (var k = 0; k < board.completed.length; k++) {
      var item = board.completed[k];
      var itemText = typeof item === 'string' ? item : item.text;
      var priority = typeof item === 'string' ? '' : (item.priority || '');
      var status = typeof item === 'string' ? '' : (item.status || '');
      var recurrence = typeof item === 'string' ? '' : (item.recurrence || '');
      
      csv += escapeCSV(board.name) + ',' + escapeCSV(itemText) + ',' + priority + ',' + status + ',' + recurrence + ',Completed\n';
    }
  }
  
  downloadFile(csv, 'todo-data-' + new Date().toISOString().split('T')[0] + '.csv', 'text/csv');
}

// Export to TXT
function exportToTXT() {
  var txt = 'TODO LIST EXPORT\n';
  txt += 'Generated: ' + new Date().toLocaleString() + '\n';
  txt += '===============================================\n\n';
  
  for (var i = 0; i < data.boards.length; i++) {
    var board = data.boards[i];
    txt += 'BOARD: ' + board.name + '\n';
    txt += '-----------------------------------------------\n\n';
    
    if (board.todo.length > 0) {
      txt += 'INCOMPLETE TASKS:\n';
      for (var j = 0; j < board.todo.length; j++) {
        var item = board.todo[j];
        var itemText = typeof item === 'string' ? item : item.text;
        var priority = typeof item === 'string' ? '' : (item.priority ? ' [' + item.priority.toUpperCase() + ']' : '');
        txt += '  ☐ ' + itemText + priority + '\n';
      }
      txt += '\n';
    }
    
    if (board.completed.length > 0) {
      txt += 'COMPLETED TASKS:\n';
      for (var k = 0; k < board.completed.length; k++) {
        var item = board.completed[k];
        var itemText = typeof item === 'string' ? item : item.text;
        txt += '  ☑ ' + itemText + '\n';
      }
      txt += '\n';
    }
    
    txt += '\n';
  }
  
  downloadFile(txt, 'todo-data-' + new Date().toISOString().split('T')[0] + '.txt', 'text/plain');
}

// Helper function to download file
function downloadFile(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Helper function to escape CSV values
function escapeCSV(str) {
  if (!str) return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// Import from JSON
function importFromJSON(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var imported = JSON.parse(e.target.result);
      
      if (imported.boards) {
        // Backup current data
        var backup = JSON.parse(JSON.stringify(data));
        
        // Merge or replace
        if (confirm('Do you want to MERGE this data with existing tasks? (OK=Merge, Cancel=Replace)')) {
          // Merge
          for (var i = 0; i < imported.boards.length; i++) {
            var importedBoard = imported.boards[i];
            var existingBoard = data.boards.find(b => b.name === importedBoard.name);
            
            if (existingBoard) {
              existingBoard.todo = existingBoard.todo.concat(importedBoard.todo || []);
              existingBoard.completed = existingBoard.completed.concat(importedBoard.completed || []);
            } else {
              importedBoard.id = data.nextBoardId++;
              data.boards.push(importedBoard);
            }
          }
        } else {
          // Replace
          data.boards = imported.boards;
          data.currentBoardId = imported.currentBoardId || 1;
          data.nextBoardId = imported.nextBoardId || (Math.max(...data.boards.map(b => b.id)) + 1);
        }
        
        dataObjectUpdated();
        currentBoardId = data.currentBoardId;
        renderBoardTabs();
        renderTodoList();
        
        alert('Data imported successfully!');
      } else {
        alert('Invalid file format');
      }
    } catch (error) {
      alert('Error importing file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// ========== KEYBOARD SHORTCUTS ==========

document.addEventListener('keydown', function(e) {
  // Check if we're typing in an input
  var isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
  
  // Ctrl/Cmd shortcuts
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      document.getElementById('item').focus();
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      document.getElementById('exportModal').classList.add('show');
    } else if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      document.getElementById('importModal').classList.add('show');
    } else if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      var toggle = document.getElementById('themeToggle');
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event('change'));
    } else if (e.key === 's' || e.key === 'S') {
      e.preventDefault();
      exportToJSON();
    }
  }
  
  // ? key for shortcuts (unless typing)
  if (!isInput && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
    e.preventDefault();
    document.getElementById('shortcutsModal').classList.add('show');
  }
  
  // Esc to close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(function(modal) {
      modal.classList.remove('show');
    });
  }
});

// ========== EVENT LISTENERS FOR NEW BUTTONS ==========

// Export button
document.getElementById('exportBtn').addEventListener('click', function() {
  document.getElementById('exportModal').classList.add('show');
});

// Import button
document.getElementById('importBtn').addEventListener('click', function() {
  document.getElementById('importModal').classList.add('show');
});

// Shortcuts button
document.getElementById('shortcutsBtn').addEventListener('click', function() {
  document.getElementById('shortcutsModal').classList.add('show');
});

// Export format buttons
document.getElementById('exportJsonBtn').addEventListener('click', function() {
  exportToJSON();
  document.getElementById('exportModal').classList.remove('show');
});

document.getElementById('exportCsvBtn').addEventListener('click', function() {
  exportToCSV();
  document.getElementById('exportModal').classList.remove('show');
});

document.getElementById('exportTxtBtn').addEventListener('click', function() {
  exportToTXT();
  document.getElementById('exportModal').classList.remove('show');
});

// Import file handling
document.getElementById('confirmImportBtn').addEventListener('click', function() {
  var file = document.getElementById('importFile').files[0];
  if (file) {
    importFromJSON(file);
    document.getElementById('importModal').classList.remove('show');
    document.getElementById('importFile').value = '';
  } else {
    alert('Please select a file');
  }
});

document.getElementById('cancelImportBtn').addEventListener('click', function() {
  document.getElementById('importModal').classList.remove('show');
  document.getElementById('importFile').value = '';
});

// Close export modal when clicking close
document.getElementById('exportModal').querySelector('.close').addEventListener('click', function() {
  document.getElementById('exportModal').classList.remove('show');
});

// Close import modal when clicking close
document.getElementById('importModal').querySelector('.close').addEventListener('click', function() {
  document.getElementById('importModal').classList.remove('show');
  document.getElementById('importFile').value = '';
});

// Close shortcuts modal when clicking close
document.getElementById('shortcutsModal').querySelector('.close').addEventListener('click', function() {
  document.getElementById('shortcutsModal').classList.remove('show');
});

