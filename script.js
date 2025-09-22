// ✅ Replace these with your contract info
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
    "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getRecentGMs",
    "outputs": [
      {
        "components":[
          {"internalType":"address","name":"sender","type":"address"},
          {"internalType":"uint256","name":"timestamp","type":"uint256"}
        ],
        "internalType":"struct GMContract.GM[]",
        "name":"",
        "type":"tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

let provider, signer, contract, userAddress;

// ✅ Connect Wallet
document.getElementById("connectBtn").addEventListener("click", async () => {
  if (typeof window.ethereum === "undefined") {
    alert("MetaMask not detected! Please install MetaMask.");
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    document.getElementById("walletAddress").innerText = userAddress;
    alert("Wallet connected: " + userAddress);

    loadStats();
  } catch (err) {
    console.error(err);
    alert("Failed to connect wallet.");
  }
});

// ✅ Faucet Button
document.getElementById("faucetBtn").addEventListener("click", () => {
  window.open("https://faucet.zenchain.io/", "_blank");
});

// ✅ Send GM
document.getElementById("gmBtn").addEventListener("click", async () => {
  if (!contract) {
    alert("Please connect wallet first.");
    return;
  }

  try {
    const tx = await contract.sendGM();
    await tx.wait();
    alert("GM sent successfully!");
    loadStats();
  } catch (err) {
    console.error(err);
    alert("Transaction failed.");
  }
});

// ✅ Load stats
async function loadStats() {
  if (!contract) return;

  try {
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
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}
