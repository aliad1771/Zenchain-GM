// ZenChain Testnet connection parameters
const ZENCHAIN_PARAMS = {
    chainId: "0x20E8", // 8408 in hex
    chainName: "ZenChain Testnet",
    nativeCurrency: {
        name: "ZTC",
        symbol: "ZTC",
        decimals: 18,
    },
    rpcUrls: ["https://zenchain-testnet.api.onfinality.io/public"],
    blockExplorerUrls: ["https://scan-testnet.zenchain.io/"]
};

// Contract address
const CONTRACT_ADDRESS = "0x08530f863E91EdB25be68407053Da6Df867B2a68";

// Contract ABI
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "COOLDOWN",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRecentGMs",
    "outputs": [{
      "components": [
        { "internalType": "address", "name": "sender", "type": "address" },
        { "internalType": "uint256", "name": "timestamp", "type": "uint256" }
      ],
      "internalType": "struct GMContract.GM[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
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
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getRemainingCooldown",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sendGM",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "NewGM",
    "type": "event"
  }
];

let provider;
let signer;
let contract;
let currentAccount = null;
let cooldownInterval;

// Connect/disconnect wallet
async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask not found!");
        return;
    }
    try {
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ZENCHAIN_PARAMS],
        });

        if (currentAccount) {
            currentAccount = null;
            document.getElementById("connectButton").innerText = "Connect Wallet";
            document.getElementById("userAddress").innerText = "";
            return;
        }

        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        currentAccount = accounts[0];
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        document.getElementById("connectButton").innerText = "Disconnect Wallet";
        document.getElementById("userAddress").innerText = "Connected: " + currentAccount;

        loadStats();
    } catch (err) {
        console.error(err);
    }
}

// Open ZenChain faucet
function getFaucet() {
    window.open("https://faucet.zenchain.io/", "_blank");
}

// Send GM
async function sendGM() {
    try {
        const tx = await contract.sendGM();
        await tx.wait();
        alert("GM sent!");
        loadStats();
        checkCooldown();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// Load stats: total GMs and recent GMs
async function loadStats() {
    if (!contract) return;

    const total = await contract.getTotalGMs();
    document.getElementById("totalGMs").innerText = total.toString();

    const recents = await contract.getRecentGMs();
    const list = document.getElementById("recentGMs");
    list.innerHTML = "";
    recents.forEach((gm) => {
        const li = document.createElement("li");
        const date = new Date(gm.timestamp * 1000);
        li.textContent = `${gm.sender} — ${date.toLocaleString()}`;
        list.appendChild(li);
    });

    checkCooldown();
}

// Check cooldown
async function checkCooldown() {
    if (!contract || !currentAccount) return;
    const remaining = await contract.getRemainingCooldown(currentAccount);
    const button = document.getElementById("gmButton");
    const timer = document.getElementById("cooldownTimer");

    if (remaining.toString() === "0") {
        button.disabled = false;
        timer.innerText = "";
        clearInterval(cooldownInterval);
    } else {
        button.disabled = true;
        let seconds = parseInt(remaining.toString());
        updateTimer(seconds, timer, button);
        cooldownInterval = setInterval(() => {
            seconds--;
            updateTimer(seconds, timer, button);
            if (seconds <= 0) clearInterval(cooldownInterval);
        }, 1000);
    }
}

function updateTimer(seconds, timer, button) {
    if (seconds <= 0) {
        timer.innerText = "";
        button.disabled = false;
    } else {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        timer.innerText = `Cooldown: ${h}h ${m}m ${s}s`;
    }
}

// Auto refresh stats every 15 seconds
setInterval(loadStats, 15000);
