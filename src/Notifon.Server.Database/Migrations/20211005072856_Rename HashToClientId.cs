using Microsoft.EntityFrameworkCore.Migrations;

namespace Notifon.Server.Database.Migrations
{
    public partial class RenameHashToClientId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Hash",
                table: "ClientInfos",
                newName: "ClientId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ClientId",
                table: "ClientInfos",
                newName: "Hash");
        }
    }
}
