const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
const verifyStr = "npx hardhat verify --network";

const apeXAddress = "0x8aA6B0E10BD6DBaf5159967F92f2E740afE2b4C3";
const usdcAddress = "0x39C6E50227cBd9Bc80b18f1F918d73C91B44293c";
const keeper = "0x1956b2c4C511FDDd9443f50b36C4597D10cD9985";
const twamm = "0xFe2E5fCe86495560574270f1F97a5ce9f534Cf94";
const twammTermSwap = "0x6c859b445695E216e348A75287B453A2329F391F";
const initBuyingRate = BigNumber.from("1000000000000000");

const redeemTime = Math.floor(new Date() / 1000) + 60;
const duration = 24 * 60 * 60;
const distributeTime = Math.floor(new Date() / 1000) + 60;
const initReward = BigNumber.from("1000000000000000000");
const delta = 50;

let owner;
let apeX;
let banana;
let usdc;
let distributor;
let claimable;
let buybackPool;

const main = async () => {
  [owner] = await ethers.getSigners();
  await createOrAttachMockToken();
  await createBanana();
  await createClaimable();
  await createDistributor();
  await createBuybackPool();
};

async function createOrAttachMockToken() {
  const MockToken = await ethers.getContractFactory("MockToken");
  if (apeXAddress == "") {
    apeX = await MockToken.deploy("MockApeX", "APEX");
    await apeX.mint(owner.address, BigNumber.from("10000000000000000000000000000"));
    console.log("APEX:", apeX.address);
    console.log(verifyStr, process.env.HARDHAT_NETWORK, apeX.address, "MockApeX", "APEX");
  } else {
    apeX = await MockToken.attach(apeXAddress);
  }

  if (usdcAddress == "") {
    usdc = await MockToken.deploy("MockUSDC", "USDC");
    await usdc.mint(owner.address, BigNumber.from("10000000000000000000000000000"));
    console.log("USDC:", usdc.address);
    console.log(verifyStr, process.env.HARDHAT_NETWORK, usdc.address, "MockUSDC", "USDC");
  } else {
    usdc = await MockToken.attach(usdcAddress);
  }
}

async function createBanana() {
  const Banana = await ethers.getContractFactory("Banana");
  banana = await Banana.deploy(apeX.address, redeemTime);
  console.log("Banana:", banana.address);
  console.log(verifyStr, process.env.HARDHAT_NETWORK, banana.address, apeX.address, redeemTime);
}

async function createClaimable() {
  const BananaClaimable = await ethers.getContractFactory("BananaClaimable");
  claimable = await BananaClaimable.deploy(banana.address);
  console.log("BananaClaimable:", claimable.address);
  console.log(verifyStr, process.env.HARDHAT_NETWORK, claimable.address, banana.address);
}

async function createDistributor() {
  const BananaDistributor = await ethers.getContractFactory("BananaDistributor");
  distributor = await BananaDistributor.deploy(
    banana.address,
    keeper,
    claimable.address,
    duration,
    distributeTime,
    initReward,
    delta
  );
  console.log("BananaDistributor:", distributor.address);
  console.log(
    verifyStr,
    process.env.HARDHAT_NETWORK,
    distributor.address,
    banana.address,
    keeper,
    claimable.address,
    duration,
    distributeTime,
    initReward.toString(),
    delta
  );
}

async function createBuybackPool() {
  const BuybackPool = await ethers.getContractFactory("BuybackPool");
  buybackPool = await BuybackPool.deploy(
    banana.address,
    usdc.address,
    twamm,
    twammTermSwap,
    distributor.address,
    initBuyingRate
  );
  console.log("BuybackPool:", buybackPool.address);
  console.log(
    verifyStr,
    process.env.HARDHAT_NETWORK,
    buybackPool.address,
    banana.address,
    usdc.address,
    twamm,
    twammTermSwap,
    distributor.address,
    initBuyingRate.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
