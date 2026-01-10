namespace OrgLicenseManager.Exceptions;

public class BadRequestException : CustomException
{
    public BadRequestException(string message, string? detail = null)
        : base(message, StatusCodes.Status400BadRequest, detail)
    {
    }
}
