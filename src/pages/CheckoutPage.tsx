import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Truck,
  ShieldCheck,
  Check,
  Sparkles,
  MapPin,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import GoldFoil from "../components/ui/GoldFoil";
import { AppRoutes } from "../types";
import type { ShippingAddress, BookTier } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  PRICING_TIERS,
  createCheckout,
  formatPrice,
} from "../lib/lemonSqueezy";
import { supabase } from "../lib/supabase";

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const bookId = searchParams.get("bookId");

  const [tier, setTier] = useState<BookTier>("heirloom");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"tier" | "shipping" | "payment">("tier");
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const tiers = [
    {
      id: "standard" as const,
      title: PRICING_TIERS.standard.name,
      price: PRICING_TIERS.standard.price / 100,
      desc: PRICING_TIERS.standard.description,
      features: PRICING_TIERS.standard.features,
    },
    {
      id: "premium" as const,
      title: PRICING_TIERS.premium.name,
      price: PRICING_TIERS.premium.price / 100,
      desc: PRICING_TIERS.premium.description,
      features: PRICING_TIERS.premium.features,
      badge: "Most Popular",
    },
    {
      id: "heirloom" as const,
      title: PRICING_TIERS.heirloom.name,
      price: PRICING_TIERS.heirloom.price / 100,
      desc: PRICING_TIERS.heirloom.description,
      features: PRICING_TIERS.heirloom.features,
      featured: true,
    },
  ];

  const handleContinue = () => {
    if (step === "tier") {
      // Digital edition skips shipping
      if (tier === "standard") {
        setStep("payment");
      } else {
        setStep("shipping");
      }
    } else if (step === "shipping") {
      setStep("payment");
    }
  };

  const handleOrder = async () => {
    setLoading(true);

    try {
      // Handle missing bookId - create a placeholder or use demo flow
      const effectiveBookId = bookId || `demo-${Date.now()}`;

      // Create order in database (only if we have a real book and user)
      if (user && bookId) {
        const { error } = await supabase.from("orders").insert({
          book_id: bookId,
          user_id: user.id,
          tier,
          price: PRICING_TIERS[tier].price / 100,
          status: "pending",
          shipping_address: tier !== "standard" ? shippingAddress : null,
        });

        if (error) {
          console.error("Failed to create order:", error);
        }
      } else if (!bookId) {
        console.warn("No bookId provided - proceeding with demo checkout flow");
      }

      // Create Lemon Squeezy checkout
      const checkout = await createCheckout({
        bookId: effectiveBookId,
        tierId: tier,
        customerEmail: user?.email || "guest@example.com",
        customerName: tier !== "standard" ? shippingAddress.name : undefined,
        successUrl: `${window.location.origin}/#${AppRoutes.ORDER_SUCCESS}?book_id=${effectiveBookId}`,
      });

      // Redirect to Lemon Squeezy checkout or show error
      if (checkout.error) {
        alert(
          checkout.message || "Failed to create checkout. Please try again."
        );
        setLoading(false);
      } else if (checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const isShippingValid =
    tier === "standard" ||
    (shippingAddress.name &&
      shippingAddress.line1 &&
      shippingAddress.city &&
      shippingAddress.state &&
      shippingAddress.postalCode &&
      shippingAddress.country);

  return (
    <div className="min-h-screen bg-stone-50 py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-emerald-950 mb-4">
            Complete the Legacy
          </h1>
          <p className="text-stone-500 max-w-2xl mx-auto">
            Choose how you'd like to preserve this story. Our physical editions
            are printed on museum-quality paper designed to last generations.
          </p>

          {/* Step Indicator */}
          <div className="flex justify-center gap-4 mt-8">
            {["tier", "shipping", "payment"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === s
                      ? "bg-amber-500 text-white"
                      : i < ["tier", "shipping", "payment"].indexOf(step)
                      ? "bg-emerald-500 text-white"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {i < ["tier", "shipping", "payment"].indexOf(step) ? (
                    <Check size={16} />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-16 h-1 rounded ${
                      i < ["tier", "shipping", "payment"].indexOf(step)
                        ? "bg-emerald-500"
                        : "bg-stone-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Tier Selection */}
        {step === "tier" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {tiers.map((t) => (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -8 }}
                  onClick={() => setTier(t.id)}
                  className={`relative cursor-pointer rounded-[2.5rem] p-8 transition-all duration-500 ${
                    tier === t.id
                      ? t.featured
                        ? "bg-emerald-950 text-white ring-4 ring-amber-400 shadow-2xl scale-105"
                        : "bg-white ring-2 ring-amber-400 shadow-xl"
                      : "bg-white hover:shadow-lg border border-stone-100"
                  }`}
                >
                  {t.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                      {t.badge}
                    </span>
                  )}
                  {t.featured && tier === t.id && (
                    <Sparkles className="absolute top-6 right-6 text-amber-400" />
                  )}

                  <h3
                    className={`text-2xl font-serif mb-2 ${
                      tier === t.id && t.featured
                        ? "text-white"
                        : "text-emerald-950"
                    }`}
                  >
                    {t.title}
                  </h3>

                  <div className="mb-4">
                    {tier === t.id && t.featured ? (
                      <GoldFoil className="text-4xl font-serif">
                        ${t.price}
                      </GoldFoil>
                    ) : (
                      <span className="text-4xl font-serif text-emerald-950">
                        ${t.price}
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-sm mb-6 ${
                      tier === t.id && t.featured
                        ? "text-emerald-100"
                        : "text-stone-500"
                    }`}
                  >
                    {t.desc}
                  </p>

                  <ul className="space-y-3">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm">
                        <Check
                          size={16}
                          className={
                            tier === t.id && t.featured
                              ? "text-amber-400"
                              : "text-emerald-600"
                          }
                        />
                        <span
                          className={
                            tier === t.id && t.featured
                              ? "text-emerald-100"
                              : "text-stone-600"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button onClick={handleContinue} icon={<Check size={18} />}>
                Continue with {tiers.find((t) => t.id === tier)?.title}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Shipping Address */}
        {step === "shipping" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-stone-200/50 border border-stone-100">
              <h2 className="text-2xl font-serif text-emerald-950 mb-8 flex items-center gap-3">
                <MapPin className="text-amber-500" /> Shipping Address
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        name: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.line1}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        line1: e.target.value,
                      })
                    }
                    placeholder="123 Main Street"
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.line2}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        line2: e.target.value,
                      })
                    }
                    placeholder="Apt 4B"
                    className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      placeholder="New York"
                      className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value,
                        })
                      }
                      placeholder="NY"
                      className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value,
                        })
                      }
                      placeholder="10001"
                      className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                      Country
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          country: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all font-medium"
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep("tier")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!isShippingValid}
                  className="flex-1"
                  icon={<Check size={18} />}
                >
                  Continue to Payment
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === "payment" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12"
          >
            {/* Order Summary */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-stone-200/50 border border-stone-100">
              <h2 className="text-2xl font-serif text-emerald-950 mb-8 flex items-center gap-3">
                <Truck className="text-amber-500" /> Order Summary
              </h2>

              <div className="space-y-6">
                <div className="flex justify-between items-end pb-6 border-b border-stone-200">
                  <div>
                    <h4 className="font-bold text-emerald-950 uppercase tracking-widest text-xs mb-1">
                      Product
                    </h4>
                    <p className="font-serif text-xl border-b-2 border-amber-200 inline-block">
                      {tiers.find((t) => t.id === tier)?.title}
                    </p>
                  </div>
                  <span className="font-serif text-xl text-emerald-950">
                    {formatPrice(PRICING_TIERS[tier].price)}
                  </span>
                </div>

                {tier !== "standard" && (
                  <div className="pb-6 border-b border-stone-200">
                    <h4 className="font-bold text-emerald-950 uppercase tracking-widest text-xs mb-2">
                      Ship To
                    </h4>
                    <p className="text-stone-600 text-sm">
                      {shippingAddress.name}
                      <br />
                      {shippingAddress.line1}
                      {shippingAddress.line2 && <>, {shippingAddress.line2}</>}
                      <br />
                      {shippingAddress.city}, {shippingAddress.state}{" "}
                      {shippingAddress.postalCode}
                      <br />
                      {shippingAddress.country}
                    </p>
                  </div>
                )}

                <div className="flex justify-between text-stone-500 text-sm">
                  <span>Shipping & Handling</span>
                  <span className="text-emerald-600 font-bold uppercase tracking-widest">
                    Free
                  </span>
                </div>

                <div className="pt-6 mt-6 border-t-2 border-stone-200 flex justify-between items-center">
                  <span className="text-2xl font-serif text-emerald-950 font-bold">
                    Total
                  </span>
                  <GoldFoil className="text-3xl font-serif">
                    {formatPrice(PRICING_TIERS[tier].price)}
                  </GoldFoil>
                </div>

                <div className="bg-emerald-50 rounded-2xl p-6 mt-6 border border-emerald-100 italic text-emerald-800 text-sm">
                  {tier === "heirloom"
                    ? '"This heirloom will be hand-inspected for quality before being dispatched from our London workshop."'
                    : tier === "premium"
                    ? '"Your premium edition will be printed on archival-quality paper and shipped within 5-7 business days."'
                    : '"Your digital edition will be available for instant download after payment."'}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-stone-200/50 border border-stone-100">
              <h2 className="text-2xl font-serif text-emerald-950 mb-8 flex items-center gap-3">
                <CreditCard className="text-amber-500" /> Payment
              </h2>

              <div className="space-y-6">
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                  <p className="text-amber-800 text-sm">
                    <strong>Secure Checkout:</strong> You'll be redirected to
                    Stripe's secure payment page to complete your purchase.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setStep(tier === "standard" ? "tier" : "shipping")
                    }
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleOrder}
                    isLoading={loading}
                    className="flex-1"
                    icon={<Sparkles size={18} />}
                  >
                    {loading ? "Processing..." : "Complete Purchase"}
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-stone-400 pt-4">
                  <ShieldCheck size={20} />
                  <span className="text-xs font-medium uppercase tracking-widest">
                    Secure 256-bit SSL encryption
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
