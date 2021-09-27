var expect    = require("chai").expect;
var endpointManager = require("../server/modules/libs/callbackManager");

describe("Endpoint Manager", function() {
  it("Checking database adding", async function() {
    await endpointManager.set("test","test") 
    expect(await endpointManager.get("test")).to.equal("test");
  });
  it("Checking database removing", async function() {
    await endpointManager.clear()  
    expect(await endpointManager.get("test")).to.be.undefined
  });
});