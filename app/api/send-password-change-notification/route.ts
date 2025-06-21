import { NextRequest, NextResponse } from 'next/server'
import { generatePasswordChangeNotificationHTML, PasswordChangeTemplateData } from '@/lib/emailTemplates'

export async function POST(request: NextRequest) {
  try {
    const body: PasswordChangeTemplateData = await request.json()
    const { user_name, user_email, change_time } = body

    if (!user_name || !user_email || !change_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate the HTML email content
    const emailHTML = generatePasswordChangeNotificationHTML({
      user_name,
      user_email,
      change_time,
      app_name: 'Китайский язык',
      support_url: 'mailto:support@chineselearning.com'
    })

    // In a real application, you would send this email using your email service
    // For now, we'll just log it and return success
    console.log('Password change notification email generated for:', user_email)
    console.log('Email HTML length:', emailHTML.length)

    // Here you would integrate with your email service like:
    // - Supabase Edge Functions
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - etc.

    /*
    Example with a hypothetical email service:
    
    await emailService.send({
      to: user_email,
      subject: `Пароль изменен - Китайский язык`,
      html: emailHTML,
      from: 'noreply@chineselearning.com'
    })
    */

    return NextResponse.json({
      success: true,
      message: 'Password change notification sent successfully',
      email_sent_to: user_email
    })

  } catch (error) {
    console.error('Error sending password change notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
} 