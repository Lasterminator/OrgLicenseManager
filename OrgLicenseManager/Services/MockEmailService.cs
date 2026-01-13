namespace OrgLicenseManager.Services;

public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendInvitationEmailAsync(string toEmail, string organizationName, string invitationToken)
    {
        _logger.LogInformation(
            "MOCK EMAIL: Invitation sent to {Email} for organization '{OrganizationName}'. Token: {Token}",
            toEmail,
            organizationName,
            invitationToken);

        return Task.CompletedTask;
    }
}
