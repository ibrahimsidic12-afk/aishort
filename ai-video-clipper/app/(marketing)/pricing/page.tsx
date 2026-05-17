export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      interval: "forever",
      features: [
        "5 videos/month",
        "3 clips per video",
        "720p rendering",
        "Basic captions",
        "1GB storage",
      ],
    },
    {
      name: "Pro",
      price: "$29",
      interval: "/month",
      features: [
        "50 videos/month",
        "10 clips per video",
        "1080p rendering",
        "Animated captions",
        "50GB storage",
        "YouTube & TikTok publishing",
        "Priority processing",
      ],
      popular: true,
    },
    {
      name: "Business",
      price: "$99",
      interval: "/month",
      features: [
        "Unlimited videos",
        "25 clips per video",
        "4K rendering",
        "Custom branding",
        "500GB storage",
        "All platforms",
        "Team collaboration",
        "API access",
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-center text-4xl font-bold">Simple Pricing</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Choose the plan that fits your content creation needs.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-8 ${plan.popular ? "border-primary shadow-lg" : ""}`}
          >
            {plan.popular && (
              <span className="text-xs font-medium text-primary">
                Most Popular
              </span>
            )}
            <h3 className="mt-2 text-xl font-bold">{plan.name}</h3>
            <p className="mt-2">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground">{plan.interval}</span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <span className="text-primary">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
            <button className="mt-8 w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
