// ⚡ Replace with your contract details
const CONTRACT_ADDRESS = "0x08530f863e91edb25be68407053da6df867b2a68"; 
const CONTRACT_ABI = [
  // Example ABI - replace with your real ABI
  {
    "inputs": [],
    "name": "sendGM",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalGMs",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLastGMs",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "sender", "type": "address" },
          { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
        ],
        "internalType": "struct GMContract.GM[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider;
let signer;
let contract;
let currentAccount = null;
let cooldownTimer = null;

// --------------------- CONNECT WALLET ---------------------
document.getElementById("connectButton").addEventListener("click", async () => {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask not found! Please install it.");
    return;
  }

  try {
    if (!currentAccount) {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      currentAccount = accounts[0];
      document.getElementById("connectButton").innerText = `Disconnect (${currentAccount.slice(0, 6)}...)`;
      setupProvider();
    } else {
      currentAccount = null;
      document.getElementById("connectButton").innerText = "Connect Wallet";
    }
  } catch (err) {
    console.error("Wallet connection error:", err);
  }
});

// --------------------- SETUP PROVIDER ---------------------
function setupProvider() {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  signer = provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  refreshData();
}

// --------------------- SEND GM ---------------------
document.getElementById("gmButton").addEventListener("click", async () => {
  if (!contract || !currentAccount) {
    alert("Please connect wallet first!");
    ret
