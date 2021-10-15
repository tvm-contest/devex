using Microsoft.EntityFrameworkCore.Migrations;

namespace Notifon.Server.Database.Migrations
{
    public partial class RenameCollumnUrlToEndpoint : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Url",
                table: "ClientInfos",
                newName: "Endpoint");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Endpoint",
                table: "ClientInfos",
                newName: "Url");
        }
    }
}
