namespace OrgLicenseManager.Services;

public interface IEmailService
{
    Task SendInvitationEmailAsync(string toEmail, string organizationName, string invitationToken);
}
