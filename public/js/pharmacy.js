// Modal functionality
const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close-btn');
const saveBtn = document.querySelector('.modal .btn-save');
const cancelBtn = document.querySelector('.modal .btn-cancel');

// Add event listeners to all edit buttons
document.addEventListener('DOMContentLoaded', function() {
    const editButtons = document.querySelectorAll('.btn-edit-row');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const medicationData = JSON.parse(this.dataset.medication);
            openEditModal(medicationData);
        });
    });

    // Add event listeners for modal buttons
    if (saveBtn) {
        saveBtn.addEventListener('click', saveChanges);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeEditModal);
    }
});

function openEditModal(medication) {
    document.getElementById('editId').value = medication.Medication_ID;
    document.getElementById('editName').value = medication.Medication_Name;
    document.getElementById('editExpiration').value = new Date(medication.Expiration_Date).toISOString().split('T')[0];
    document.getElementById('editQuantity').value = medication.Stock_Level;
    document.getElementById('editPrice').value = medication.Amount;
    document.getElementById('editStatus').value = medication.Status;
    modal.style.display = 'flex';
}

function closeEditModal() {
    modal.style.display = 'none';
}

closeBtn.onclick = closeEditModal;

window.onclick = function(event) {
    if (event.target == modal) {
        closeEditModal();
    }
}

async function saveChanges() {
    try {
        const id = document.getElementById('editId').value;
        if (!id) {
            throw new Error('Could not find medication ID');
        }

        const updatedData = {
            Medication_Name: document.getElementById('editName').value.trim(),
            Expiration_Date: document.getElementById('editExpiration').value.trim(),
            Stock_Level: parseInt(document.getElementById('editQuantity').value),
            Amount: parseFloat(document.getElementById('editPrice').value),
            Status: document.getElementById('editStatus').value
        };

        // Validation
        if (!updatedData.Medication_Name) {
            throw new Error('Medication Name cannot be empty');
        }

        if (isNaN(updatedData.Stock_Level) || updatedData.Stock_Level < 0) {
            throw new Error('Quantity must be a valid positive number');
        }

        if (isNaN(updatedData.Amount) || updatedData.Amount < 0) {
            throw new Error('Price must be a valid positive number');
        }

        if (!updatedData.Expiration_Date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }

        const date = new Date(updatedData.Expiration_Date);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid expiration date');
        }

        const response = await fetch(`/pharmacy/update-medication/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update medication');
        }

        closeEditModal();
        showMessage('Changes saved successfully!', 'success');
        
        // Refresh the table data
        await refreshTableData();

    } catch (error) {
        console.error('Error:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Function to save changes for a single row
async function saveRowChanges(button) {
    try {
        const row = button.closest('tr');
        if (!row) {
            throw new Error('Could not find the row to update');
        }

        const id = row.dataset.id;
        if (!id) {
            throw new Error('Could not find medication ID');
        }

        // Get values from the row
        const nameCell = row.querySelector('[data-field="Medication_Name"]');
        const expirationCell = row.querySelector('[data-field="Expiration_Date"]');
        const stockCell = row.querySelector('[data-field="Stock_Level"]');
        const amountCell = row.querySelector('[data-field="Amount"]');
        const statusSelect = row.querySelector('select[data-field="Status"]');

        if (!nameCell || !expirationCell || !stockCell || !amountCell || !statusSelect) {
            throw new Error('Could not find all required fields');
        }

        const updatedData = {
            Medication_Name: nameCell.textContent.trim(),
            Expiration_Date: expirationCell.textContent.trim(),
            Stock_Level: parseInt(stockCell.textContent),
            Amount: parseFloat(amountCell.textContent),
            Status: statusSelect.value
        };

        // Validation
        if (!updatedData.Medication_Name) {
            throw new Error('Medication Name cannot be empty');
        }

        if (isNaN(updatedData.Stock_Level) || updatedData.Stock_Level < 0) {
            throw new Error('Quantity must be a valid positive number');
        }

        if (isNaN(updatedData.Amount) || updatedData.Amount < 0) {
            throw new Error('Price must be a valid positive number');
        }

        if (!updatedData.Expiration_Date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }

        const date = new Date(updatedData.Expiration_Date);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid expiration date');
        }

        // Send update request
        const response = await fetch(`/pharmacy/update-medication/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update medication');
        }

        // Show success message
        showMessage('Changes saved successfully!', 'success');

        // Refresh the table data
        await refreshTableData();

    } catch (error) {
        console.error('Error:', error);
        showMessage('Error: ' + error.message, 'error');
    }
}

// Helper function to show messages
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Helper function to refresh table data
async function refreshTableData() {
    try {
        const response = await fetch('/pharmacy/filter?name=');
        if (!response.ok) {
            throw new Error('Failed to refresh medication data');
        }
        const medications = await response.json();
        
        const tableBody = document.getElementById('medicationTableBody');
        if (!tableBody) {
            throw new Error('Could not find table body element');
        }

        tableBody.innerHTML = medications.map(medication => `
            <tr data-id="${medication.Medication_ID}">
                <td contenteditable="true" class="editable" data-field="Medication_Name">${medication.Medication_Name}</td>
                <td contenteditable="true" class="editable" data-field="Expiration_Date">${new Date(medication.Expiration_Date).toISOString().split('T')[0]}</td>
                <td contenteditable="true" class="editable" data-field="Stock_Level">${medication.Stock_Level}</td>
                <td contenteditable="true" class="editable" data-field="Amount">${medication.Amount}</td>
                <td>
                    <select class="editable-select" data-field="Status">
                        <option value="In Stock" ${medication.Status === 'In Stock' ? 'selected' : ''}>In Stock</option>
                        <option value="Low Stock" ${medication.Status === 'Low Stock' ? 'selected' : ''}>Low Stock</option>
                        <option value="Out of Stock" ${medication.Status === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                    </select>
                </td>
                <td>
                    <button type="button" class="btn-save-row" onclick="saveRowChanges(this)">Save</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error refreshing table:', error);
        showMessage('Error refreshing table: ' + error.message, 'error');
    }
}

// Filter functionality
async function filterMedications() {
    const filterValue = document.getElementById('filterName').value;

    try {
        const response = await fetch(`/pharmacy/filter?name=${filterValue}`);
        if (!response.ok) {
            throw new Error('Failed to fetch filtered medications');
        }
        const medications = await response.json();

        const tableBody = document.getElementById('medicationTableBody');
        tableBody.innerHTML = medications.map(medication => `
            <tr data-id="${medication.Medication_ID}">
                <td contenteditable="true" class="editable" data-field="Medication_Name">${medication.Medication_Name}</td>
                <td contenteditable="true" class="editable" data-field="Expiration_Date">${new Date(medication.Expiration_Date).toISOString().split('T')[0]}</td>
                <td contenteditable="true" class="editable" data-field="Stock_Level">${medication.Stock_Level}</td>
                <td contenteditable="true" class="editable" data-field="Amount">${medication.Amount}</td>
                <td>
                    <select class="editable-select" data-field="Status">
                        <option value="In Stock" ${medication.Status === 'In Stock' ? 'selected' : ''}>In Stock</option>
                        <option value="Low Stock" ${medication.Status === 'Low Stock' ? 'selected' : ''}>Low Stock</option>
                        <option value="Out of Stock" ${medication.Status === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
                    </select>
                </td>
                <td>
                    <button type="button" class="btn-save-row" onclick="saveRowChanges(this)">Save</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error.message);
    }
} 