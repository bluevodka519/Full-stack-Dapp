import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAppToken Contract", function () {
  let token: any;
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addr3: any;
  
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const TRANSFER_AMOUNT = ethers.parseEther("1000"); // 1K tokens
  const MINT_AMOUNT = ethers.parseEther("500"); // 500 tokens

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    
    // Deploy token contract
    token = await ethers.deployContract("DAppToken", [INITIAL_SUPPLY]);
  });

  describe("Deployment", function () {
    it("Should set the correct token metadata", async function () {
      expect(await token.name()).to.equal("DApp Demo Token");
      expect(await token.symbol()).to.equal("DDT");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign total supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should set the correct owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer from owner to addr1
      await token.transfer(addr1.address, TRANSFER_AMOUNT);
      
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(TRANSFER_AMOUNT);
      
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY - TRANSFER_AMOUNT);
    });

    it("Should emit Transfer event", async function () {
      await expect(token.transfer(addr1.address, TRANSFER_AMOUNT))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, TRANSFER_AMOUNT);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const excessiveAmount = initialOwnerBalance + ethers.parseEther("1");
      
      await expect(
        token.transfer(addr1.address, excessiveAmount)
      ).to.be.revertedWith("DAppToken: insufficient balance");
    });

    it("Should fail when transferring to zero address", async function () {
      await expect(
        token.transfer(ethers.ZeroAddress, TRANSFER_AMOUNT)
      ).to.be.revertedWith("DAppToken: invalid address");
    });
  });

  describe("Approvals and TransferFrom", function () {
    it("Should approve tokens for delegated transfer", async function () {
      await token.approve(addr1.address, TRANSFER_AMOUNT);
      
      const allowance = await token.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(TRANSFER_AMOUNT);
    });

    it("Should emit Approval event", async function () {
      await expect(token.approve(addr1.address, TRANSFER_AMOUNT))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, TRANSFER_AMOUNT);
    });

    it("Should allow delegated transfer", async function () {
      // Owner approves addr1 to spend tokens
      await token.approve(addr1.address, TRANSFER_AMOUNT);
      
      // addr1 transfers from owner to addr2
      await token.connect(addr1).transferFrom(owner.address, addr2.address, TRANSFER_AMOUNT);
      
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(TRANSFER_AMOUNT);
      
      // Check allowance is reduced
      const remainingAllowance = await token.allowance(owner.address, addr1.address);
      expect(remainingAllowance).to.equal(0);
    });

    it("Should fail delegated transfer without approval", async function () {
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, TRANSFER_AMOUNT)
      ).to.be.revertedWith("DAppToken: insufficient allowance");
    });

    it("Should fail delegated transfer with insufficient allowance", async function () {
      await token.approve(addr1.address, TRANSFER_AMOUNT);
      
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, TRANSFER_AMOUNT + ethers.parseEther("1"))
      ).to.be.revertedWith("DAppToken: insufficient allowance");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const initialSupply = await token.totalSupply();
      const initialBalance = await token.balanceOf(addr1.address);
      
      await token.mint(addr1.address, MINT_AMOUNT);
      
      const newSupply = await token.totalSupply();
      const newBalance = await token.balanceOf(addr1.address);
      
      expect(newSupply).to.equal(initialSupply + MINT_AMOUNT);
      expect(newBalance).to.equal(initialBalance + MINT_AMOUNT);
    });

    it("Should emit Mint and Transfer events", async function () {
      await expect(token.mint(addr1.address, MINT_AMOUNT))
        .to.emit(token, "Mint")
        .withArgs(addr1.address, MINT_AMOUNT)
        .and.to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, MINT_AMOUNT);
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        token.connect(addr1).mint(addr2.address, MINT_AMOUNT)
      ).to.be.revertedWith("DAppToken: caller is not the owner");
    });

    it("Should fail when minting to zero address", async function () {
      await expect(
        token.mint(ethers.ZeroAddress, MINT_AMOUNT)
      ).to.be.revertedWith("DAppToken: invalid address");
    });

    it("Should fail when minting zero amount", async function () {
      await expect(
        token.mint(addr1.address, 0)
      ).to.be.revertedWith("DAppToken: mint amount must be positive");
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Give addr1 some tokens to burn
      await token.transfer(addr1.address, TRANSFER_AMOUNT);
    });

    it("Should allow token burning", async function () {
      const initialSupply = await token.totalSupply();
      const initialBalance = await token.balanceOf(addr1.address);
      const burnAmount = ethers.parseEther("100");
      
      await token.connect(addr1).burn(burnAmount);
      
      const newSupply = await token.totalSupply();
      const newBalance = await token.balanceOf(addr1.address);
      
      expect(newSupply).to.equal(initialSupply - burnAmount);
      expect(newBalance).to.equal(initialBalance - burnAmount);
    });

    it("Should emit Burn and Transfer events", async function () {
      const burnAmount = ethers.parseEther("100");
      
      await expect(token.connect(addr1).burn(burnAmount))
        .to.emit(token, "Burn")
        .withArgs(addr1.address, burnAmount)
        .and.to.emit(token, "Transfer")
        .withArgs(addr1.address, ethers.ZeroAddress, burnAmount);
    });

    it("Should fail when burning more than balance", async function () {
      const balance = await token.balanceOf(addr1.address);
      const excessiveAmount = balance + ethers.parseEther("1");
      
      await expect(
        token.connect(addr1).burn(excessiveAmount)
      ).to.be.revertedWith("DAppToken: insufficient balance to burn");
    });

    it("Should fail when burning zero amount", async function () {
      await expect(
        token.connect(addr1).burn(0)
      ).to.be.revertedWith("DAppToken: burn amount must be positive");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await token.transferOwnership(addr1.address);
      expect(await token.owner()).to.equal(addr1.address);
    });

    it("Should emit OwnershipTransferred event", async function () {
      await expect(token.transferOwnership(addr1.address))
        .to.emit(token, "OwnershipTransferred")
        .withArgs(owner.address, addr1.address);
    });

    it("Should fail when non-owner tries to transfer ownership", async function () {
      await expect(
        token.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWith("DAppToken: caller is not the owner");
    });

    it("Should fail when transferring to zero address", async function () {
      await expect(
        token.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("DAppToken: invalid address");
    });
  });

  describe("View Functions", function () {
    it("Should return correct balance", async function () {
      await token.transfer(addr1.address, TRANSFER_AMOUNT);
      
      const balance = await token.getBalance(addr1.address);
      expect(balance).to.equal(TRANSFER_AMOUNT);
    });

    it("Should return correct allowance", async function () {
      await token.approve(addr1.address, TRANSFER_AMOUNT);
      
      const allowance = await token.getAllowance(owner.address, addr1.address);
      expect(allowance).to.equal(TRANSFER_AMOUNT);
    });
  });

  describe("Gas Usage", function () {
    it("Should use reasonable gas for transfers", async function () {
      const tx = await token.transfer(addr1.address, TRANSFER_AMOUNT);
      const receipt = await tx.wait();
      
      // Transfer should use less than 100k gas
      expect(receipt?.gasUsed).to.be.lessThan(100000);
    });

    it("Should use reasonable gas for approvals", async function () {
      const tx = await token.approve(addr1.address, TRANSFER_AMOUNT);
      const receipt = await tx.wait();
      
      // Approval should use less than 50k gas
      expect(receipt?.gasUsed).to.be.lessThan(50000);
    });
  });
});
