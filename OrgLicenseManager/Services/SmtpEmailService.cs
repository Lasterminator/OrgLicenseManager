using System.Net;
using System.Net.Mail;

namespace OrgLicenseManager.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendInvitationEmailAsync(string toEmail, string organizationName, string invitationToken)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var smtpHost = emailSettings["SmtpHost"] ?? "smtp.gmail.com";
        var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
        var senderEmail = emailSettings["SenderEmail"] ?? throw new InvalidOperationException("SenderEmail not configured");
        var senderPassword = emailSettings["SenderPassword"] ?? throw new InvalidOperationException("SenderPassword not configured");
        var senderName = emailSettings["SenderName"] ?? "OrgLicenseManager";
        var baseUrl = emailSettings["BaseUrl"] ?? "http://localhost:5050";

        var acceptLink = $"{baseUrl}/api/memberships/invitations/accept?token={Uri.EscapeDataString(invitationToken)}";

        var subject = $"You've been invited to join {organizationName}";
        var body = BuildInvitationEmailBody(organizationName, invitationToken, acceptLink);

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(senderEmail, senderPassword),
            EnableSsl = true
        };

        var message = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };
        message.To.Add(toEmail);

        try
        {
            await client.SendMailAsync(message);
            _logger.LogInformation("Invitation email sent successfully to {Email} for organization '{OrganizationName}'",
                toEmail, organizationName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send invitation email to {Email}", toEmail);
            throw;
        }
    }

    private static string BuildInvitationEmailBody(string organizationName, string invitationToken, string acceptLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4A90D9; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f9f9f9; }}
        .button {{ display: inline-block; background-color: #4A90D9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }}
        .button:hover {{ background-color: #357ABD; }}
        .token-box {{ background-color: #fff; border: 2px dashed #ccc; padding: 15px; margin: 20px 0; text-align: center; }}
        .token {{ font-family: monospace; font-size: 12px; word-break: break-all; color: #666; }}
        .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        .divider {{ border-top: 1px solid #ddd; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>You're Invited!</h1>
        </div>
        <div class='content'>
            <p>Hello,</p>
            <p>You have been invited to join <strong>{organizationName}</strong> on OrgLicenseManager.</p>

            <p style='text-align: center;'>
                <a href='{acceptLink}' class='button' style='color: white;'>Accept Invitation</a>
            </p>

            <div class='divider'></div>

            <p style='font-size: 13px; color: #666;'>Or copy and paste this link in your browser:</p>
            <p style='font-size: 12px; word-break: break-all; color: #4A90D9;'>{acceptLink}</p>

            <div class='divider'></div>

            <p style='font-size: 13px; color: #666;'>If the link doesn't work, use this token manually:</p>
            <div class='token-box'>
                <p class='token'>{invitationToken}</p>
            </div>

            <p style='font-size: 13px; color: #888;'>This invitation will expire in 7 days.</p>
        </div>
        <div class='footer'>
            <p>This is an automated message from OrgLicenseManager. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>";
    }
}
