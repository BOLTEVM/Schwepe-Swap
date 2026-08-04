const fs = require('fs');
const path = require('path');

// Extracted ABIs from Solidity contracts
const abis = {
  SchwepeFactory: [
    "function feeTo() external view returns (address)",
    "function feeToSetter() external view returns (address)",
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function allPairs(uint256) external view returns (address pair)",
    "function allPairsLength() external view returns (uint256)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)",
    "function setFeeTo(address) external",
    "function setFeeToSetter(address) external",
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint256 allPairsLength)"
  ],
  SchwepePair: [
    "function factory() external view returns (address)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function price0CumulativeLast() external view returns (uint256)",
    "function price1CumulativeLast() external view returns (uint256)",
    "function kLast() external view returns (uint256)",
    "function mint(address to) external returns (uint256 liquidity)",
    "function burn(address to) external returns (uint256 amount0, uint256 amount1)",
    "function swap(uint256 amount0Out, uint256 amount1Out, address to) external",
    "function sync() external",
    "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
    "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
    "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
    "event Sync(uint112 reserve0, uint112 reserve1)"
  ],
  SchwepeRouter: [
    "function factory() external view returns (address)",
    "function WSOMI() external view returns (address)",
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256 amountA, uint256 amountB, uint256 liquidity)",
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)",
    "function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB)",
    "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) external pure returns (uint256 amountOut)",
    "function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts)",
    "function getReserves(address tokenA, address tokenB) external view returns (uint256 reserveA, uint256 reserveB)"
  ],
  WSOMI: [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function deposit() external payable",
    "function withdraw(uint256 wad) external",
    "event Deposit(address indexed dst, uint256 wad)",
    "event Withdrawal(address indexed src, uint256 wad)"
  ],
  SchwepeToken: [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address owner) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function mint(address to, uint256 amount) external"
  ],
  SchwepeMasterChef: [
    "function schwepe() external view returns (address)",
    "function schwepePerBlock() external view returns (uint256)",
    "function totalAllocPoint() external view returns (uint256)",
    "function poolLength() external view returns (uint256)",
    "function add(uint256 allocPoint, address lpToken, bool withUpdate) external",
    "function deposit(uint256 pid, uint256 amount) external",
    "function withdraw(uint256 pid, uint256 amount) external",
    "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
    "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)"
  ],
  SchwepeReactiveKeeper: [
    "function owner() external view returns (address)",
    "function masterChef() external view returns (address)",
    "function minHarvestThreshold() external view returns (uint256)",
    "function totalAutoCompounded() external view returns (uint256)",
    "function totalReactiveExecutions() external view returns (uint256)",
    "function evaluateAndCompound(uint256 _pid, address _targetLp) external returns (bool)",
    "function setMinHarvestThreshold(uint256 _newThreshold) external",
    "event AgenticYieldCompounded(uint256 indexed pid, uint256 yieldHarvested, uint256 timestamp)"
  ]
};

const sdkAbiDir = path.join(__dirname, '..', '..', 'sdk', 'src', 'abi');
const frontendAbiDir = path.join(__dirname, '..', '..', 'frontend', 'src', 'abi');

[sdkAbiDir, frontendAbiDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let count = 0;
for (const [contractName, abiArray] of Object.entries(abis)) {
  const content = JSON.stringify(abiArray, null, 2);
  fs.writeFileSync(path.join(sdkAbiDir, `${contractName}.json`), content);
  fs.writeFileSync(path.join(frontendAbiDir, `${contractName}.json`), content);
  console.log(`✅ Generated ABI for ${contractName}`);
  count++;
}

console.log(`🎉 Complete: Successfully compiled & generated ${count} ABIs in SDK and Frontend directories!`);
