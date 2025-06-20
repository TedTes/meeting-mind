import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

export async function POST(request) {
  try {
     // Try both sync and async versions of auth()
     let authResult;
     try {
       authResult = await auth();
     } catch (error) {
       // If await fails, try sync version
       authResult = auth();
     }
     const { userId } = authResult || {};
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

     // Validate plan
     if (!plan || !['starter', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 });
    }

        const priceId = plan === 'starter'? process.env.POLAR_STARTER_PRICE_ID : process.env.POLAR_PRO_PRICE_ID;
    // Create checkout session with Polar
    const checkout = await polar.checkouts.create({
      products: [priceId],
      successUrl: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/cancel`,
      metadata: {
        userId: userId,
        plan:  plan
      }
    });

    return NextResponse.json({ 
      checkoutUrl: checkout.url,
      checkoutId: checkout.id 
    });

  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
}