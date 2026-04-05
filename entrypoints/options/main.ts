const CONFIG_KEY = 'chess_coach_config';

interface UserConfig {
  username: string;
  analysisMode: 'chess-com' | 'local-rules' | 'ai';
  apiKey: string;
}

async function loadConfig(): Promise<UserConfig> {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return result[CONFIG_KEY] || { username: '', analysisMode: 'chess-com', apiKey: '' };
}

async function saveConfig(config: UserConfig): Promise<void> {
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
}

function showMessage(text: string, type: 'success' | 'error') {
  const msgEl = document.getElementById('message')!;
  msgEl.textContent = text;
  msgEl.className = `message ${type}`;
  msgEl.style.display = 'block';
  setTimeout(() => msgEl.style.display = 'none', 3000);
}

// DOM Elements
const usernameInput = document.getElementById('username') as HTMLInputElement;
const apiKeyGroup = document.getElementById('api-key-group')!;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const radioItems = document.querySelectorAll('.radio-item');
const radioInputs = document.querySelectorAll('input[name="analysisMode"]');
const form = document.getElementById('config-form') as HTMLFormElement;

// Initialize
async function init() {
  const config = await loadConfig();
  usernameInput.value = config.username || '';

  // Set radio
  radioItems.forEach(item => {
    const value = (item as HTMLElement).dataset.value;
    const input = item.querySelector('input') as HTMLInputElement;
    if (value === config.analysisMode) {
      item.classList.add('selected');
      input.checked = true;
    } else {
      item.classList.remove('selected');
    }
  });

  // Show/hide API Key
  apiKeyGroup.style.display = config.analysisMode === 'ai' ? 'block' : 'none';
  apiKeyInput.value = config.apiKey || '';
}

// Radio change handler
radioInputs.forEach(input => {
  input.addEventListener('change', () => {
    radioItems.forEach(item => {
      const inputEl = item.querySelector('input') as HTMLInputElement;
      if (inputEl.checked) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    const selectedValue = document.querySelector('input[name="analysisMode"]:checked') as HTMLInputElement;
    apiKeyGroup.style.display = selectedValue?.value === 'ai' ? 'block' : 'none';
  });
});

// Label click handler
radioItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
  });
});

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const selectedRadio = document.querySelector('input[name="analysisMode"]:checked') as HTMLInputElement;
  const analysisMode = selectedRadio?.value || 'chess-com';
  const apiKey = analysisMode === 'ai' ? apiKeyInput.value : '';

  if (!usernameInput.value.trim()) {
    showMessage('请输入用户名', 'error');
    return;
  }

  if (analysisMode === 'ai' && !apiKey.trim()) {
    showMessage('AI 模式需要填写 API Key', 'error');
    return;
  }

  const config: UserConfig = {
    username: usernameInput.value.trim(),
    analysisMode: analysisMode as UserConfig['analysisMode'],
    apiKey: apiKey.trim(),
  };

  console.log('[Settings] Saving config:', JSON.stringify(config));

  try {
    await saveConfig(config);
    console.log('[Settings] Config saved successfully');
    showMessage('✅ 配置已保存！', 'success');
  } catch (err) {
    console.error('[Settings] Save failed:', err);
    showMessage('保存失败: ' + (err as Error).message, 'error');
  }
});

// Back button
document.getElementById('btn-back')?.addEventListener('click', () => {
  window.close();
});

// Initialize on load
init();
