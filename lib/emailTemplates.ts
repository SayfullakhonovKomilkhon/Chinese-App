// =====================================================
// EMAIL TEMPLATES
// =====================================================
// HTML email templates for user verification and notifications
// =====================================================

export interface EmailTemplateData {
  user_name: string
  user_role: string
  verification_url: string
  app_name?: string
  company_name?: string
}

/**
 * Generate verification email HTML template
 */
export function generateVerificationEmailHTML(data: EmailTemplateData): string {
  const {
    user_name,
    user_role,
    verification_url,
    app_name = "Китайский язык",
    company_name = "Chinese Learning Platform"
  } = data

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение Email - ${app_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .role-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 25px;
        }
        
        .role-student {
            background-color: #e6fffa;
            color: #234e52;
            border: 1px solid #81e6d9;
        }
        
        .role-admin {
            background-color: #fef5e7;
            color: #744210;
            border: 1px solid #f6ad55;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(66, 153, 225, 0.3);
        }
        
        .verify-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(66, 153, 225, 0.4);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .alternative-link {
            margin-top: 25px;
            padding: 20px;
            background-color: #f7fafc;
            border-radius: 8px;
            border-left: 4px solid #4299e1;
        }
        
        .alternative-link p {
            font-size: 14px;
            color: #4a5568;
            margin-bottom: 10px;
        }
        
        .alternative-link a {
            color: #4299e1;
            word-break: break-all;
            text-decoration: none;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        .security-notice {
            background-color: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 8px;
            padding: 16px;
            margin: 25px 0;
        }
        
        .security-notice p {
            font-size: 14px;
            color: #744210;
            margin: 0;
        }
        
        .features {
            margin: 30px 0;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .feature-icon {
            width: 20px;
            height: 20px;
            background-color: #4299e1;
            border-radius: 50%;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        
        .feature-text {
            font-size: 14px;
            color: #4a5568;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .verify-button {
                display: block;
                width: 100%;
                padding: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🇨🇳 ${app_name}</h1>
            <p>Добро пожаловать в мир китайского языка!</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Привет, ${user_name}! 👋
            </div>
            
            <div class="role-badge ${user_role === 'admin' ? 'role-admin' : 'role-student'}">
                ${user_role === 'admin' ? '👑 Администратор' : '🎓 Студент'}
            </div>
            
            <div class="message">
                Спасибо за регистрацию на нашей платформе для изучения китайского языка! 
                Для завершения регистрации и активации вашего аккаунта, пожалуйста, 
                подтвердите ваш email адрес, нажав на кнопку ниже.
            </div>
            
            <div class="button-container">
                <a href="${verification_url}" class="verify-button">
                    ✅ Подтвердить Email
                </a>
            </div>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">📚</div>
                    <div class="feature-text">Интерактивные карточки для изучения иероглифов</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🧠</div>
                    <div class="feature-text">Система интервального повторения</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <div class="feature-text">Отслеживание прогресса и статистика</div>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">Персонализированные уроки</div>
                </div>
            </div>
            
            <div class="security-notice">
                <p>
                    <strong>🔒 Безопасность:</strong> Эта ссылка действительна в течение 24 часов. 
                    Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.
                </p>
            </div>
            
            <div class="alternative-link">
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в браузер:</p>
                <a href="${verification_url}">${verification_url}</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${company_name}</strong></p>
            <p>Ваш путь к изучению китайского языка начинается здесь!</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Если у вас есть вопросы, свяжитесь с нами: support@chineselearning.com
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Generate welcome email HTML template (sent after email verification)
 */
export function generateWelcomeEmailHTML(data: EmailTemplateData): string {
  const {
    user_name,
    user_role,
    app_name = "Китайский язык",
    company_name = "Chinese Learning Platform"
  } = data

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Добро пожаловать - ${app_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .success-icon {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .success-icon div {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            border-radius: 50%;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            text-align: center;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            text-align: center;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .get-started-button {
            display: inline-block;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(72, 187, 120, 0.3);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .next-steps {
            background-color: #f7fafc;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .next-steps h3 {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            text-align: center;
        }
        
        .step-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
            padding: 12px;
            background-color: white;
            border-radius: 8px;
            border-left: 4px solid #48bb78;
        }
        
        .step-number {
            width: 24px;
            height: 24px;
            background-color: #48bb78;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
            flex-shrink: 0;
        }
        
        .step-content {
            flex: 1;
        }
        
        .step-title {
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 4px;
        }
        
        .step-description {
            font-size: 14px;
            color: #4a5568;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .get-started-button {
                display: block;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🎉 Добро пожаловать!</h1>
        </div>
        
        <div class="content">
            <div class="success-icon">
                <div>✅</div>
            </div>
            
            <div class="greeting">
                ${user_name}, ваш аккаунт активирован!
            </div>
            
            <div class="message">
                Поздравляем! Ваш email успешно подтвержден, и теперь вы можете 
                начать изучение китайского языка на нашей платформе.
            </div>
            
            <div class="button-container">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${user_role === 'admin' ? 'teacher' : 'student'}" class="get-started-button">
                    🚀 Начать изучение
                </a>
            </div>
            
            <div class="next-steps">
                <h3>Ваши первые шаги:</h3>
                
                <div class="step-item">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <div class="step-title">Войдите в систему</div>
                        <div class="step-description">Используйте ваш email и пароль для входа</div>
                    </div>
                </div>
                
                ${user_role === 'student' ? `
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-title">Выберите категорию</div>
                        <div class="step-description">Начните с базовых фраз или HSK 1</div>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-title">Изучайте слова</div>
                        <div class="step-description">Используйте карточки и систему повторения</div>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <div class="step-title">Отслеживайте прогресс</div>
                        <div class="step-description">Смотрите статистику и достижения</div>
                    </div>
                </div>
                ` : `
                <div class="step-item">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <div class="step-title">Панель администратора</div>
                        <div class="step-description">Управляйте пользователями и контентом</div>
                    </div>
                </div>
                
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <div class="step-title">Добавьте контент</div>
                        <div class="step-description">Создавайте новые категории и слова</div>
                    </div>
                </div>
                `}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${company_name}</strong></p>
            <p>Удачи в изучении китайского языка! 加油！</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Нужна помощь? Напишите нам: support@chineselearning.com
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version of verification email
 */
export function generateVerificationEmailText(data: EmailTemplateData): string {
  const { user_name, user_role, verification_url, app_name = "Китайский язык" } = data
  
  return `
Привет, ${user_name}!

Добро пожаловать в ${app_name}!

Спасибо за регистрацию как ${user_role === 'admin' ? 'Администратор' : 'Студент'}.

Для завершения регистрации, пожалуйста, подтвердите ваш email адрес, перейдя по ссылке:

${verification_url}

Эта ссылка действительна в течение 24 часов.

Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.

--
Chinese Learning Platform
Ваш путь к изучению китайского языка начинается здесь!
  `.trim()
}

// =====================================================
// EMAIL CHANGE VERIFICATION TEMPLATES
// =====================================================

export interface EmailChangeTemplateData {
  user_name: string
  old_email: string
  new_email: string
  verification_url: string
  app_name?: string
}

/**
 * Generate email change verification HTML template
 */
export function generateEmailChangeVerificationHTML(data: EmailChangeTemplateData): string {
  const {
    user_name,
    old_email,
    new_email,
    verification_url,
    app_name = "Китайский язык"
  } = data

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение изменения Email - ${app_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .email-change-info {
            background-color: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .email-change-info h3 {
            color: #22543d;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .email-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding: 8px 0;
        }
        
        .email-label {
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
        }
        
        .email-value {
            font-family: 'Courier New', monospace;
            background-color: #edf2f7;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            color: #2d3748;
        }
        
        .verify-button {
            display: inline-block;
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(72, 187, 120, 0.3);
        }
        
        .verify-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
        }
        
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        
        .alternative-link {
            margin-top: 25px;
            padding: 20px;
            background-color: #f7fafc;
            border-radius: 8px;
            border-left: 4px solid #48bb78;
        }
        
        .alternative-link p {
            font-size: 14px;
            color: #4a5568;
            margin-bottom: 10px;
        }
        
        .alternative-link a {
            color: #48bb78;
            word-break: break-all;
            text-decoration: none;
        }
        
        .security-notice {
            background-color: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 8px;
            padding: 16px;
            margin: 25px 0;
        }
        
        .security-notice p {
            font-size: 14px;
            color: #744210;
            margin: 0;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0 10px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .email-row {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .email-value {
                margin-top: 4px;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔄 Изменение Email</h1>
            <p>Подтверждение нового адреса электронной почты</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Привет, ${user_name}! 👋
            </div>
            
            <div class="message">
                Вы запросили изменение email адреса в вашем аккаунте <strong>${app_name}</strong>. 
                Для завершения процесса изменения, пожалуйста, подтвердите ваш новый email адрес.
            </div>
            
            <div class="email-change-info">
                <h3>📧 Детали изменения:</h3>
                <div class="email-row">
                    <span class="email-label">Старый email:</span>
                    <span class="email-value">${old_email}</span>
                </div>
                <div class="email-row">
                    <span class="email-label">Новый email:</span>
                    <span class="email-value">${new_email}</span>
                </div>
            </div>
            
            <div class="button-container">
                <a href="${verification_url}" class="verify-button">
                    ✅ Подтвердить новый email
                </a>
            </div>
            
            <div class="alternative-link">
                <p><strong>Не работает кнопка?</strong> Скопируйте и вставьте эту ссылку в ваш браузер:</p>
                <a href="${verification_url}">${verification_url}</a>
            </div>
            
            <div class="security-notice">
                <p>
                    <span class="icon">🔒</span>
                    <strong>Безопасность:</strong> Эта ссылка действительна в течение 24 часов. 
                    Если вы не запрашивали изменение email, немедленно свяжитесь с нами.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${app_name}</strong></p>
            <p>Изучение китайского языка стало проще</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Если вы не запрашивали изменение email, просто проигнорируйте это письмо.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

// =====================================================
// PASSWORD CHANGE NOTIFICATION TEMPLATES
// =====================================================

export interface PasswordChangeTemplateData {
  user_name: string
  user_email: string
  change_time: string
  app_name?: string
  support_url?: string
}

/**
 * Generate password change notification HTML template
 */
export function generatePasswordChangeNotificationHTML(data: PasswordChangeTemplateData): string {
  const {
    user_name,
    user_email,
    change_time,
    app_name = "Китайский язык",
    support_url = "mailto:support@chineselearning.com"
  } = data

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Пароль изменен - ${app_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .change-info {
            background-color: #f0fff4;
            border: 1px solid #9ae6b4;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .change-info h3 {
            color: #22543d;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding: 8px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #2d3748;
            font-size: 14px;
        }
        
        .info-value {
            font-family: 'Courier New', monospace;
            background-color: #edf2f7;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
            color: #2d3748;
        }
        
        .security-notice {
            background-color: #fed7d7;
            border: 1px solid #fc8181;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .security-notice h3 {
            color: #742a2a;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .security-notice p {
            font-size: 14px;
            color: #742a2a;
            margin-bottom: 8px;
        }
        
        .support-button {
            display: inline-block;
            background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(229, 62, 62, 0.3);
        }
        
        .support-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
        }
        
        .security-tips {
            background-color: #ebf8ff;
            border: 1px solid #90cdf4;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .security-tips h3 {
            color: #2c5282;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .security-tips ul {
            list-style-type: none;
            padding: 0;
        }
        
        .security-tips li {
            color: #2c5282;
            font-size: 14px;
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        
        .security-tips li:before {
            content: '🛡️';
            position: absolute;
            left: 0;
        }
        
        .footer {
            background-color: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 0 10px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .info-row {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .info-value {
                margin-top: 4px;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🔐 Пароль изменен</h1>
            <p>Уведомление о безопасности аккаунта</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Привет, ${user_name}! 👋
            </div>
            
            <div class="message">
                Ваш пароль в <strong>${app_name}</strong> был успешно изменен. 
                Данное письмо отправлено для подтверждения изменений в аккаунте.
            </div>
            
            <div class="change-info">
                <h3>📋 Детали изменения:</h3>
                <div class="info-row">
                    <span class="info-label">Email аккаунта:</span>
                    <span class="info-value">${user_email}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Время изменения:</span>
                    <span class="info-value">${change_time}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Действие:</span>
                    <span class="info-value">Пароль изменен</span>
                </div>
            </div>
            
            <div class="security-notice">
                <h3>⚠️ Не вы изменили пароль?</h3>
                <p>
                    Если вы не изменяли пароль, ваш аккаунт может быть скомпрометирован. 
                    Немедленно свяжитесь с нашей службой поддержки.
                </p>
                <p style="margin-top: 15px;">
                    <a href="${support_url}" class="support-button">
                        🆘 Связаться с поддержкой
                    </a>
                </p>
            </div>
            
            <div class="security-tips">
                <h3>💡 Рекомендации по безопасности:</h3>
                <ul>
                    <li>Применяйте уникальные пароли для каждого сайта</li>
                    <li>Активируйте двухфакторную аутентификацию</li>
                    <li>Контролируйте активность в аккаунте</li>
                    <li>Не сообщайте пароли другим людям</li>
                    <li>Применяйте менеджер паролей</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${app_name}</strong></p>
            <p>Изучение китайского языка стало проще</p>
            <p style="margin-top: 15px; font-size: 12px;">
                Это автоматическое уведомление о безопасности. Не отвечайте на это письмо.
            </p>
        </div>
    </div>
</body>
</html>
  `.trim()
} 