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

// --------------------- ADD ZENCHAIN NETWORK IF NEEDED ---------------------
async function addZenChainNetworkIfNeeded() {
  if (!window.ethereum) return;

  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainIdNum = parseInt(chainIdHex, 16);

    if (chainIdNum === 8408) {
      console.log("Already on ZenChain Testnet");
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2098' }]
      });
      console.log("Switched to ZenChain Testnet");
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x2098',
            chainName: 'ZenChain Testnet',
            rpcUrls: ['https://zenchain-testnet.api.onfinality.io/public'],
            nativeCurrency: { name: 'ZenChain Token', symbol: 'ZTC', decimals: 18 },
            blockExplorerUrls: ['https://zentrace.io/']
          }]
        });
        console.log("ZenChain Testnet added to MetaMask");
      } else {
        throw switchError;
      }
    }

  } catch (err) {
    console.error("Error adding/switching network:", err);
    alert("Failed to add/switch ZenChain network in MetaMask");
  }
}

// --------------------- CONNECT WALLET ---------------------
document.getElementById("connectButton").addEventListener("click", async () => {
  if (!window.ethereum) {
    alert("MetaMask not found! Please install it.");
    return;
  }

  if (currentAccount) {
    currentAccount = null;
    provider = null;
    signer = null;
    contract = null;
    document.getElementById("connectButton").innerText = "Connect Wallet";
    alert("🔌 Wallet disconnected");
    return;
  }

  try {
    await addZenChainNetworkIfNeeded();

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];
    document.getElementById("connectButton").innerText = `Disconnect (${currentAccount.slice(0,6)}...)`;

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    refreshData();

  } catch(err) {
    console.error("Wallet connection error:", err);
    alert("Failed to connect wallet");
  }
});

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
  } catch(err) {
    console.error("Error fetching total GMs:", err);
    document.getElementById("gmCount").innerText = "Error";
  }

  try {
    const gms = await contract.getLastGMs();
    const list = document.getElementById("gmList");
    list.innerHTML = "";
    gms.slice(-5).reverse().forEach(gm => {
      const ts = gm.timestamp.toNumber ? gm.timestamp.toNumber() : parseInt(gm.timestamp);
      const date = new Date(ts * 1000).toLocaleString();
      const li = document.createElement("li");
      li.textContent = `${gm.sender} at ${date}`;
      list.appendChild(li);
    });
  } catch(err) {
    console.error("Error fetching last GMs:", err);
    document.getElementById("gmList").innerHTML = "<li>No data or error</li>";
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
