namespace OrgLicenseManager.Exceptions;

public class UnauthorizedException : CustomException
{
    public UnauthorizedException(string message, string? detail = null)
        : base(message, StatusCodes.Status401Unauthorized, detail)
    {
    }
}
