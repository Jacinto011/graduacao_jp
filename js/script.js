        // URL da API do Google Apps Script
        const API_URL = 'https://script.google.com/macros/s/AKfycbx91V94ggFKt7TOqCnxTpdiGPhJyIQzVq9nwpKOOulFg3ZBWp9KLIGQpF2y8tIes_ZSjw/exec';
        
        // Variável para controlar o temporizador de fechamento
        let closeTimer = null;
        let countdownInterval = null;
        
        function toggleCompanionField() {
            const companionSelect = document.getElementById('companion');
            const companionField = document.getElementById('companionField');

            if (companionSelect.value === 'yes') {
                companionField.style.display = 'block';
                console.log('Campo de acompanhante exibido');
            } else {
                companionField.style.display = 'none';
                console.log('Campo de acompanhante ocultado');
            }
        }
        
        // Função para iniciar a contagem regressiva e fechar a janela
        function startAutoCloseCountdown() {
            let secondsLeft = 60;
            const countdownElement = document.getElementById('countdown');
            
            // Atualizar a contagem regressiva a cada segundo
            countdownInterval = setInterval(() => {
                secondsLeft--;
                countdownElement.textContent = `Esta página será fechada automaticamente em ${secondsLeft} segundos.`;
                
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    attemptToCloseWindow();
                }
            }, 1000);
            
            // Configurar o temporizador para fechar a janela após 60 segundos
            closeTimer = setTimeout(attemptToCloseWindow, 30000);
        }
        
        // Função para tentar fechar a janela
        function attemptToCloseWindow() {
            console.log('Tentando fechar a janela...');
            
            // Limpar os intervalos
            if (closeTimer) clearTimeout(closeTimer);
            if (countdownInterval) clearInterval(countdownInterval);
            
            // Tentar fechar a janela (pode não funcionar em todos os navegadores)
            try {
                // Para janelas abertas por script: window.close() funciona
                // Para outras janelas, podemos redirecionar ou apenas mostrar uma mensagem
                if (window.opener || window.history.length === 1) {
                    // Se foi aberta por outra janela ou é a única no histórico
                    window.close();
                } else {
                    // Caso contrário, tentamos fechar mas pode ser bloqueado pelo navegador
                    window.close();
                    // Fallback: redirecionar para uma página em branco ou de agradecimento
                    setTimeout(() => {
                        document.body.innerHTML = '<div style="text-align:center;padding:50px;"><h2>Obrigado por confirmar!</h2><p>Você pode fechar esta janela agora.</p></div>';
                    }, 1000);
                }
            } catch (error) {
                console.log('Não foi possível fechar a janela automaticamente:', error);
                // Fallback: mostrar mensagem para o usuário fechar manualmente
                document.getElementById('countdown').textContent = 'Você pode fechar esta janela agora. Obrigado!';
            }
        }

        // Criar iframe oculto para receber respostas
        const hiddenIframe = document.createElement('iframe');
        hiddenIframe.name = 'hiddenIframe';
        hiddenIframe.style.display = 'none';
        document.body.appendChild(hiddenIframe);

        // Adicionar listener para o iframe capturar respostas
        hiddenIframe.addEventListener('load', function() {
            console.log('Resposta recebida do Google Apps Script');
            // Não podemos acessar o conteúdo devido à política de mesma origem
        });

        document.getElementById('rsvpForm').addEventListener('submit', function (e) {
            e.preventDefault();
            console.log('Formulário submetido');
            
            // Elementos da UI
            const loadingElement = document.getElementById('loading');
            const successElement = document.getElementById('successMessage');
            const errorElement = document.getElementById('errorMessage');
            const submitButton = this.querySelector('button[type="submit"]');
            
            // Esconder mensagens anteriores
            successElement.style.display = 'none';
            errorElement.style.display = 'none';
            
            // Mostrar loading
            loadingElement.style.display = 'block';
            submitButton.disabled = true;
            console.log('UI atualizada: loading visível, botão desabilitado');
            
            // Coletar dados do formulário
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                companion: document.getElementById('companion').value,
                companionName: document.getElementById('companion').value === 'yes' 
                    ? document.getElementById('companionName').value 
                    : ''
            };
            
            console.log('Dados coletados:', formData);
            
            try {
                // Método 1: Usar fetch com redirecionamento (mais moderno)
                // Como não podemos ler a resposta devido ao CORS, assumimos sucesso
                // após um tempo razoável para a requisição completar
                
                fetch(API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                })
                .then(() => {
                    console.log('Requisição fetch enviada (modo no-cors)');
                    
                    // Dar um tempo para o processamento no servidor
                    setTimeout(() => {
                        loadingElement.style.display = 'none';
                        successElement.style.display = 'block';
                        document.getElementById('rsvpForm').reset();
                        toggleCompanionField();
                        submitButton.disabled = false;
                        console.log('Processamento completo: sucesso assumido');
                        
                        // Iniciar a contagem regressiva para fechar a janela
                        startAutoCloseCountdown();
                    }, 2000);
                })
                .catch(error => {
                    console.error('Erro no fetch:', error);
                    loadingElement.style.display = 'none';
                    errorElement.style.display = 'block';
                    submitButton.disabled = false;
                });
                
                // Método 2: Alternativa usando formulário tradicional (backup)
                // Criar um formulário temporário para envio
                const tempForm = document.createElement('form');
                tempForm.method = 'POST';
                tempForm.action = API_URL;
                tempForm.target = 'hiddenIframe';
                tempForm.style.display = 'none';
                
                // Adicionar campos ao formulário
                for (const key in formData) {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = formData[key];
                    tempForm.appendChild(input);
                }
                
                // Adicionar formulário à página e submeter
                document.body.appendChild(tempForm);
                console.log('Formulário temporário criado como backup');
                tempForm.submit();
                
                // Remover após um tempo
                setTimeout(() => {
                    if (document.body.contains(tempForm)) {
                        document.body.removeChild(tempForm);
                        console.log('Formulário temporário removido');
                    }
                }, 3000);
                
            } catch (error) {
                console.error('Erro no processamento:', error);
                loadingElement.style.display = 'none';
                errorElement.style.display = 'block';
                submitButton.disabled = false;
            }
        });

        // Inicializar a visibilidade do campo de acompanhante
        console.log('Inicializando formulário...');
        document.getElementById('companion').addEventListener('change', toggleCompanionField);
        toggleCompanionField();
        console.log('Formulário pronto para uso');
