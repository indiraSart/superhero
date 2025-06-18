/**
 * Handles favorite functionality for the superhero application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Add to favorites
  document.querySelectorAll('.add-favorite-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const superheroId = button.dataset.superheroId;
      
      try {
        const response = await fetch('/favorites/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ superheroId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          // Update UI
          button.classList.remove('btn-outline-danger');
          button.classList.add('btn-danger');
          button.innerHTML = '<i class="fas fa-heart"></i> Added to favorites';
          
          // Show success message
          showMessage('success', 'Added to favorites!');
          
          // Update any favorite count displays
          const countElements = document.querySelectorAll(`.favorite-count-${superheroId}`);
          countElements.forEach(el => {
            el.textContent = parseInt(el.textContent || '0') + 1;
          });
        } else {
          if (response.status === 401) {
            // User not logged in
            window.location.href = '/users/login';
          } else {
            showMessage('danger', data.error || 'Failed to add to favorites');
          }
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
        showMessage('danger', 'Network error, please try again');
      }
    });
  });
  
  // Remove from favorites
  document.querySelectorAll('.remove-favorite-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const superheroId = button.dataset.superheroId;
      
      try {
        const response = await fetch(`/favorites/remove/${superheroId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // If on profile page, remove the whole card
          const favoriteCard = button.closest('.favorite-card');
          if (favoriteCard) {
            favoriteCard.remove();
            
            // If no more favorites, show empty message
            const favoritesContainer = document.getElementById('favorites-container');
            if (favoritesContainer && favoritesContainer.children.length === 0) {
              favoritesContainer.innerHTML = '<p class="text-center text-muted">You have no favorites yet.</p>';
            }
          } else {
            // Otherwise, just update button state
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-danger');
            button.innerHTML = '<i class="far fa-heart"></i> Add to favorites';
          }
          
          showMessage('success', 'Removed from favorites!');
          
          // Update any favorite count displays
          const countElements = document.querySelectorAll(`.favorite-count-${superheroId}`);
          countElements.forEach(el => {
            el.textContent = Math.max(0, parseInt(el.textContent || '0') - 1);
          });
        } else {
          const data = await response.json();
          showMessage('danger', data.error || 'Failed to remove from favorites');
        }
      } catch (error) {
        console.error('Error removing from favorites:', error);
        showMessage('danger', 'Network error, please try again');
      }
    });
  });
  
  // Update favorite description
  document.querySelectorAll('.favorite-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const superheroId = form.dataset.superheroId;
      const description = form.querySelector('.favorite-description').value;
      
      try {
        const response = await fetch(`/favorites/update/${superheroId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description })
        });
        
        if (response.ok) {
          showMessage('success', 'Description updated!');
        } else {
          const data = await response.json();
          showMessage('danger', data.error || 'Failed to update description');
        }
      } catch (error) {
        console.error('Error updating description:', error);
        showMessage('danger', 'Network error, please try again');
      }
    });
  });
  
  // Helper function to show messages
  function showMessage(type, text) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert alert-${type} alert-dismissible fade show message-alert`;
    alertBox.innerHTML = `
      ${text}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find or create alert container
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'alert-container';
      alertContainer.className = 'alert-container';
      document.body.prepend(alertContainer);
    }
    
    alertContainer.appendChild(alertBox);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      alertBox.classList.remove('show');
      setTimeout(() => alertBox.remove(), 150);
    }, 3000);
  }
});
