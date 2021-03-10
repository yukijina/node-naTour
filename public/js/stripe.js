import axios from 'axios';

const stripe = Stripe('pk_test_BUxxxxx-xxxxxxxxxxxxxx');

export const bookTour = async tourId => {
  try {
    // 1)  Get checkout session from API
    const session = await axios(
      //`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log('session==>', session);

    // 2) Create checkout for + share credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (error) {
    console.log(error);
  }
};
