document.addEventListener('DOMContentLoaded', function() {
    const cartItems = document.getElementById('cart-items');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const checkoutButton = document.getElementById('checkout');
    let cart = [];

    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const packageElement = this.closest('.package, .addon');
            let itemName = '';
            let itemPrice = '';

            if (packageElement.classList.contains('package')) {
                itemName = packageElement.getAttribute('data-package') || 'Undefined Package';
            } else if (packageElement.classList.contains('addon')) {
                itemName = packageElement.getAttribute('data-addon') || 'Undefined Add-On';
            }

            itemPrice = packageElement.getAttribute('data-price') || 'Undefined Price';

            if (itemName && itemPrice) {
                cart.push({ name: itemName, price: itemPrice });
                updateCartView();
            } else {
                console.error('Item name or price not found');
            }
        });
    });

    function updateCartView() {
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('cart-item');
            
            const itemText = document.createElement('span');
            itemText.textContent = `${item.name} - SGD $${item.price}`;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'X';
            removeButton.classList.add('remove-button');

            removeButton.addEventListener('click', () => {
                removeItemFromCart(index);
            });

            li.appendChild(itemText);
            li.appendChild(removeButton);
            cartItems.appendChild(li);
        });

        checkoutButton.style.display = cart.length > 0 ? 'block' : 'none';
    }

    function removeItemFromCart(index) {
        cart.splice(index, 1);
        updateCartView();
    }

    checkoutButton.addEventListener('click', function() {
        const form = document.createElement('form');
        form.action = '/booking/bookingform';
        form.method = 'POST';

        const cartInput = document.createElement('input');
        cartInput.type = 'hidden';
        cartInput.name = 'cart';
        cartInput.value = JSON.stringify(cart);

        form.appendChild(cartInput);
        document.body.appendChild(form);
        form.submit();
    });
});
