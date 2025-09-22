const CONTRACT_ADDRESS = "0x08530f863e91edb25be68407053da6df867b2a68"; 
const CONTRACT_ABI = [
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

let provider, signer, contract, currentAccount = null, cooldownTimer = null;

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
      document.getElementById("connectButton").innerText = `Disconnect (${currentAccount.slice(0,6)}...)`;
      setupProvider();
    } else {
      currentAccount = null;
      document.getElementById("connectButton").innerText = "Connect Wallet";
    }
  } catch(err) {
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
    return;
  }
  try {
    const tx = await contract.sendGM();
    await tx.wait();
    alert("✅ GM sent successfully!");
    startCooldown(86400);
    refreshData();
  } catch(err) {
    console.error("Error sending GM:", err);
    alert("❌ Failed to send GM");
  }
});

// --------------------- REFRESH DATA ---------------------
async function refreshData() {
  if (!contract) return;
  try {
    const total = await contract.getTotalGMs();
    document.getElementById("gmCount").innerText = total.toString();

    const gms = await contract.getLastGMs();
    const list = document.getElementById("gmList");
    list.innerHTML = "";
    gms.slice(-5).reverse().forEach(gm => {
      const li = document.createElement("li");
      const date = new Date(gm.timestamp * 1000).toLocaleString();
      li.textContent = `${gm.sender} at ${date}`;
      list.appendChild(li);
    });
  } catch(err) {
    console.error("Error fetching GM data:", err);
  }
}

// --------------------- COOLDOWN TIMER ---------------------
function startCooldown(seconds) {
  const button = document.getElementById("gmButton");
  button.disabled = true;
  let remaining = seconds;
  updateTimer(remaining);

  cooldownTimer = setInterval(() => {
    remaining--;
    if(remaining <= 0){
      clearInterval(cooldownTimer);
      button.disabled = false;
      document.getElementById("timer").innerText = "";
    } else {
      updateTimer(remaining);
    }
  }, 1000);
}

function updateTimer(seconds){
  const h = Math.floor(seconds/3600);
  const m = Math.floor((seconds%3600)/60);
  const s = seconds % 60;
  document.getElementById("timer").innerText = `⏳ Wait ${h}h ${m}m ${s}s before sending again`;
}
