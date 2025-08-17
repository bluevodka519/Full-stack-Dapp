import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Counter", function () {
  it("Should emit the Increment event when calling the inc() function", async function () {
    const counter = await ethers.deployContract("Counter");

    await expect(counter.inc()).to.emit(counter, "Increment").withArgs(1n);
  });

  it("The sum of the Increment events should match the current value", async function () {
    const counter = await ethers.deployContract("Counter");
    const deploymentBlockNumber = await ethers.provider.getBlockNumber();

    // run a series of increments
    for (let i = 1; i <= 10; i++) {
      await counter.incBy(i);
    }

    const events = await counter.queryFilter(
      counter.filters.Increment(),
      deploymentBlockNumber,
      "latest",
    );

    // check that the aggregated events match the current value
    let total = 0n;
    for (const event of events) {
      total += event.args.by;
    }

    expect(await counter.x()).to.equal(total);
  });

  it("Should deploy with initial value 0", async function () {
    const counter = await ethers.deployContract("Counter");
    expect(await counter.x()).to.equal(0);
  });

  it("Should increment by 1 using inc()", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.inc();
    expect(await counter.x()).to.equal(1);
  });

  it("Should increment by specified amount using incBy()", async function () {
    const counter = await ethers.deployContract("Counter");
    await counter.incBy(5);
    expect(await counter.x()).to.equal(5);
  });

  it("Should handle multiple increments correctly", async function () {
    const counter = await ethers.deployContract("Counter");

    await counter.inc();        // +1 = 1
    await counter.incBy(3);     // +3 = 4
    await counter.inc();        // +1 = 5

    expect(await counter.x()).to.equal(5);
  });

  it("Should reject zero increment", async function () {
    const counter = await ethers.deployContract("Counter");
    await expect(counter.incBy(0))
      .to.be.revertedWith("incBy: increment should be positive");
  });

  it("Should allow different accounts to increment", async function () {
    const counter = await ethers.deployContract("Counter");
    const [owner, addr1, addr2] = await ethers.getSigners();

    await counter.connect(addr1).inc();
    await counter.connect(addr2).incBy(3);

    expect(await counter.x()).to.equal(4);
  });
});
