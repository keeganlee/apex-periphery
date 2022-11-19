const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
const verifyStr = "npx hardhat verify --network";

const apeXAddress = "0x357c471049a5B365E93ccF8c8Dd79C69c394424f";
const usdcAddress = "0x88E48a497648932b2416b84e57Ce9192344c6114";
const bananaAddress = "";
const keeper = "0xD2B6D51Af2BF55864738FA1DB575D1c7b442B097";
const twamm = "0xFAfc103Bc7959cb033713B67F2DCA0A472c8680e";
const initPrice = BigNumber.from("290000000000000");
// const startTime = Math.floor(new Date() / 1000) + 60;
const startTime = 1668585600;
const endTime = 1668931200;
const redeemTime = 1668848400;
const duration = 24 * 60 * 60;
const distributeTime = startTime + duration;
const initReward = BigNumber.from("480769230769230800000000000");
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
  await createOrAttachBanana();
  await createClaimable();
  await createDistributor();
  await createBuybackPool();
};

async function createOrAttachMockToken() {
  const SelfSufficientERC20 = await ethers.getContractFactory("SelfSufficientERC20");
  if (apeXAddress == "") {
    apeX = await SelfSufficientERC20.deploy();
    await apeX.initlialize("MockApeX", "mAPEX", 18);
    await apeX.mint(owner.address, BigNumber.from("10000000000000000000000000000"));
    console.log("APEX:", apeX.address);
    console.log(verifyStr, process.env.HARDHAT_NETWORK, apeX.address);
  } else {
    apeX = SelfSufficientERC20.attach(apeXAddress);
  }

  if (usdcAddress == "") {
    usdc = await SelfSufficientERC20.deploy();
    await usdc.initlialize("SelfService", "SLF", 6);
    await usdc.mint(owner.address, BigNumber.from("10000000000000000"));
    console.log("USDC:", usdc.address);
    console.log(verifyStr, process.env.HARDHAT_NETWORK, usdc.address);
  } else {
    usdc = SelfSufficientERC20.attach(usdcAddress);
  }
}

async function createOrAttachBanana() {
  const Banana = await ethers.getContractFactory("Banana");
  if (bananaAddress == "") {
    banana = await Banana.deploy(apeX.address, redeemTime);
    console.log("Banana:", banana.address);
    console.log(verifyStr, process.env.HARDHAT_NETWORK, banana.address, apeX.address, redeemTime);
    // await apeX.approve(banana.address, BigNumber.from("1000000000000000000000000"));
    // await banana.mint(owner.address, BigNumber.from("1000000000000000000000000"));
  } else {
    banana = Banana.attach(bananaAddress);
  }
}

async function createClaimable() {
  const BananaClaimable = await ethers.getContractFactory("BananaClaimable");
  claimable = await BananaClaimable.deploy(banana.address);
  console.log("BananaClaimable:", claimable.address);
  console.log(verifyStr, process.env.HARDHAT_NETWORK, claimable.address, banana.address);
  await claimable.setSigner(keeper, true);
}

async function createDistributor() {
  const BananaDistributor = await ethers.getContractFactory("BananaDistributor");
  distributor = await BananaDistributor.deploy(
    banana.address,
    keeper,
    claimable.address,
    duration,
    distributeTime,
    endTime,
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
    endTime,
    initReward.toString(),
    delta
  );
}

async function createBuybackPool() {
  if (distributor == null) {
    const BananaDistributor = await ethers.getContractFactory("BananaDistributor");
    distributor = BananaDistributor.attach("0x0772ab6e3C6ba1d840608A45Ed310910F2E1A46d");
  }

  const BuybackPool = await ethers.getContractFactory("BuybackPool");
  buybackPool = await BuybackPool.deploy(
    banana.address,
    usdc.address,
    twamm,
    distributor.address,
    keeper,
    duration,
    initPrice,
    initReward,
    startTime,
    endTime
  );
  console.log("BuybackPool:", buybackPool.address);
  console.log(
    verifyStr,
    process.env.HARDHAT_NETWORK,
    buybackPool.address,
    banana.address,
    usdc.address,
    twamm,
    distributor.address,
    keeper,
    duration,
    initPrice.toString(),
    initReward.toString(),
    startTime,
    endTime
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
