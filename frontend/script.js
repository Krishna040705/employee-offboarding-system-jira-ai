let tickets = JSON.parse(localStorage.getItem('tickets')) || [
  { id: 'TCK-101', name: 'Raghavendra Kumar', desc: 'Requested deactivation after resignation', status: 'AI: Pending' },
  { id: 'TCK-102', name: 'Priyanka Reddy', desc: 'Ambiguous ticket about leave', status: 'AI: Pending' },
  { id: 'TCK-103', name: 'Venkatesh Gowda', desc: 'Resignation verified via HR mail', status: 'AI: Pending' },
  { id: 'TCK-104', name: 'Anjali Sharma', desc: 'Conflicting data found', status: 'AI: Pending' },
  { id: 'TCK-105', name: 'Karthikeya Naidu', desc: 'Proper deactivation approval received', status: 'AI: Pending' }
];

let currentTicket = null;

function updateReports() {
  document.getElementById('reportToDeactivate').innerText = tickets.filter(t => t.status.includes('Confirmed') || t.status.includes('Approved')).length;
  document.getElementById('reportPending').innerText = tickets.filter(t => t.status.includes('Unclear')).length;
  document.getElementById('reportDeactivated').innerText = tickets.filter(t => t.status.includes('Deactivated')).length;
}

function aiScanTickets() {
  const aiStatus = document.getElementById('aiStatus');
  aiStatus.innerText = 'AI Scanning tickets...';

  tickets.forEach((t, index) => {
    if (t.status === 'AI: Pending') {
      const rand = Math.random();
      if (rand > 0.5) t.status = 'AI: Confirmed';
      else t.status = 'AI: Unclear';

      if (t.status === 'AI: Unclear') setTimeout(() => generateQR(index), 500);
    }
  });

  renderTickets();
  setTimeout(() => aiStatus.innerText = 'AI Scan Complete', 1000);
}

function renderTickets() {
  const toDeactivate = document.getElementById('toDeactivate');
  const pendingApproval = document.getElementById('pendingApproval');
  const deactivated = document.getElementById('deactivated');

  toDeactivate.innerHTML = '';
  pendingApproval.innerHTML = '';
  deactivated.innerHTML = '';

  tickets.forEach((t, index) => {
    const card = document.createElement('div');
    card.className = 'ticket-card';
    if (t.status.includes('Confirmed') || t.status.includes('Approved')) card.classList.add('confirmed');
    else if (t.status.includes('Unclear')) card.classList.add('unclear');
    else if (t.status.includes('Deactivated')) card.classList.add('deactivated');

    let actionBtn = '';
    if (t.status.includes('Confirmed')) {
      actionBtn = `<button onclick="deactivate(${index})">Deactivate</button>`;
      toDeactivate.appendChild(card);
    } else if (t.status.includes('Unclear')) {
      actionBtn = `<button onclick="generateQR(${index})">Generate QR</button>`;
      pendingApproval.appendChild(card);
    } else if (t.status.includes('Approved')) {
      actionBtn = `<button onclick="deactivate(${index})">Deactivate</button>`;
      toDeactivate.appendChild(card);
    } else if (t.status.includes('Deactivated')) {
      actionBtn = 'Deactivated';
      deactivated.appendChild(card);
    }

    card.innerHTML = `
      <h3>${t.id} — ${t.name}</h3>
      <p>${t.desc}</p>
      <p>Status: <strong>${t.status}</strong></p>
      ${actionBtn}
    `;
  });

  updateReports();
  localStorage.setItem('tickets', JSON.stringify(tickets));
}

function deactivate(index) {
  tickets[index].status = 'Deactivated';
  renderTickets();
  alert(`✅ ${tickets[index].name} has been deactivated.`);
}

function generateQR(index) {
  currentTicket = index;
  const modal = document.getElementById('qrModal');
  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';

  const ticket = tickets[index];
  const qrText = `Approval Request for ${ticket.name} (${ticket.id}) — ${ticket.desc}`;

  const qr = new QRCode(qrDiv, { text: qrText, width: 300, height: 300 });

  setTimeout(() => {
    const qrImg = qrDiv.querySelector('img').src;

    fetch('http://localhost:5000/sendQR', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'authority@company.com', 

        qrDataURL: qrImg,
        ticketId: ticket.id,
        employeeName: ticket.name
      })
    })
    .then(res => res.json())
    .then(data => console.log('QR sent via email:', data))
    .catch(err => console.error('Error sending QR:', err));
  }, 500);

  modal.style.display = 'block';
  console.log(`📧AI Agent: QR generated and sending to authority for ${ticket.name}`);
}

function approveTicket() {
  if (currentTicket !== null) {
    tickets[currentTicket].status = 'Approved';
    renderTickets();
    closeQR();
    alert(`✅ Approval received for ${tickets[currentTicket].name}`);
  }
}

function closeQR() {
  document.getElementById('qrModal').style.display = 'none';
}

renderTickets();
setTimeout(aiScanTickets, 1000);

async function callAI(text, index) {
  const res = await fetch("http://127.0.0.1:8000/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text })
  });

  const data = await res.json();

  if (data.action === "deactivate") {
    tickets[index].status = "AI: Confirmed";
  } else if (data.action === "pending") {
    tickets[index].status = "AI: Unclear";
  } else {
    tickets[index].status = "AI: Keep Active";
  }

  renderTickets();
}
