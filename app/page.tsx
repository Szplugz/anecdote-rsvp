"use client"

import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Newsreader } from "next/font/google"
import { usePathname } from "next/navigation"

// Add Newsreader font for success screen
// We'll use a CSS class instead to apply the font
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "700"],
})

export default function Home() {
  const pathname = usePathname()
  const isVerci = pathname?.includes('verci')
  const [isLoaded, setIsLoaded] = useState(false)
  type DayKey = 'thursday' | 'friday' | 'saturday';

  const [counts, setCounts] = useState<Record<DayKey, number>>({
    thursday: 0,
    friday: 0,
    saturday: 0,
  })

  // Track the current form step for each day
  const [currentStep, setCurrentStep] = useState<Record<DayKey, number>>({
    thursday: 0,
    friday: 0,
    saturday: 0,
  })

  interface FormFields {
    name: string;
    email: string;
    phone: string;
    about: string;
  }

  const [formData, setFormData] = useState<Record<DayKey, FormFields[]>>({
    thursday: [{ name: "", email: "", phone: "", about: "" }],
    friday: [{ name: "", email: "", phone: "", about: "" }],
    saturday: [{ name: "", email: "", phone: "", about: "" }],
  })

  // Track validation errors
  interface ValidationField {
    name: boolean;
    email: boolean;
    phone: boolean;
    about: boolean;
  }

  type FormErrors = Record<DayKey, ValidationField[]>

  const [errors, setErrors] = useState<FormErrors>({
    thursday: [{ name: false, email: false, phone: false, about: false }],
    friday: [{ name: false, email: false, phone: false, about: false }],
    saturday: [{ name: false, email: false, phone: false, about: false }],
  })

  // Track submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submitted, setSubmitted] = useState<Record<DayKey, boolean>>({
    thursday: false,
    friday: false,
    saturday: false,
  })

  // Add this at the beginning of the component, right after the state declarations
  // This ensures the component renders in the correct initial state on the client
  const [isMounted, setIsMounted] = useState(false)

  // Add a state for phone error message
  const [phoneError, setPhoneError] = useState("")

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Set isLoaded to true after component mounts
  useEffect(() => {
    // Delay setting isLoaded to true to ensure animations work properly
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Update form data array when count changes
  useEffect(() => {
    const updateFormData = (day: 'thursday' | 'friday' | 'saturday') => {
      const count = counts[day]
      setFormData((prev) => {
        const currentForms = [...prev[day]]

        // If we need more forms, add them
        if (currentForms.length < count) {
          const newForms = Array(count - currentForms.length)
            .fill(null)
            .map(() => ({
              name: "",
              email: "",
              phone: "",
              about: "",
            }))
          return {
            ...prev,
            [day]: [...currentForms, ...newForms],
          }
        }

        // If we need fewer forms, remove them
        if (currentForms.length > count && count > 0) {
          return {
            ...prev,
            [day]: currentForms.slice(0, count),
          }
        }

        return prev
      })

      // Update errors array to match form data
      setErrors((prev) => {
        const currentErrors = [...prev[day]]

        if (currentErrors.length < count) {
          const newErrors = Array(count - currentErrors.length)
            .fill(null)
            .map(() => ({
              name: false,
              email: false,
              phone: false,
              about: false,
            }))
          return {
            ...prev,
            [day]: [...currentErrors, ...newErrors],
          }
        }

        if (currentErrors.length > count && count > 0) {
          return {
            ...prev,
            [day]: currentErrors.slice(0, count),
          }
        }

        return prev
      })

      // Reset to first step if count is reduced below current step
      if (count <= currentStep[day]) {
        setCurrentStep((prev) => ({
          ...prev,
          [day]: Math.max(0, count - 1),
        }))
      }
    }

    updateFormData("thursday")
    updateFormData("friday")
    updateFormData("saturday")
  }, [counts])

  // Modify the handleInputChange function to handle phone number formatting correctly
  const handleInputChange = (day: keyof typeof counts, step: number, field: string, value: string) => {
    // Special handling for phone number
    if (field === "phone") {
      // If the user is deleting and the value is just "+1 " or "+1", reset to empty
      if (value === "+1 " || value === "+1" || value === "+") {
        setFormData((prev) => {
          const updatedForms = [...prev[day]]
          if (updatedForms[step]) {
            updatedForms[step] = {
              ...updatedForms[step],
              [field]: "",
            }
          }
          return {
            ...prev,
            [day]: updatedForms,
          }
        })
        return
      }

      // Extract just the digits from the input
      let digitsOnly = value.replace(/\D/g, "")

      // If the value starts with "1" and it's coming from our formatting, remove it
      if (value.startsWith("+1") && digitsOnly.startsWith("1")) {
        digitsOnly = digitsOnly.substring(1)
      }

      // Limit to 10 digits
      digitsOnly = digitsOnly.substring(0, 10)

      // Format the phone number
      const formattedValue = formatPhoneNumber(digitsOnly)

      setFormData((prev) => {
        const updatedForms = [...prev[day]]
        if (updatedForms[step]) {
          updatedForms[step] = {
            ...updatedForms[step],
            [field]: formattedValue,
          }
        }
        return {
          ...prev,
          [day]: updatedForms,
        }
      })

      // Clear phone error when user types
      if (phoneError) {
        setPhoneError("")
      }
    } else {
      // Handle other fields normally
      setFormData((prev) => {
        const updatedForms = [...prev[day]]
        if (updatedForms[step]) {
          updatedForms[step] = {
            ...updatedForms[step],
            [field]: value,
          }
        }
        return {
          ...prev,
          [day]: updatedForms,
        }
      })
    }

    // Clear error when user types
    if (errors[day][step] && errors[day][step][field as keyof ValidationField]) {
      setErrors((prev) => {
        const updatedErrors = [...prev[day]]
        updatedErrors[step] = {
          ...updatedErrors[step],
          [field]: false,
        }
        return {
          ...prev,
          [day]: updatedErrors,
        }
      })
    }
  }

  // Update the formatPhoneNumber function to be more consistent
  const formatPhoneNumber = (value: string): string => {
    // If empty, return empty string
    if (!value || value.length === 0) return ""

    // Format: +1 (XXX)-XXX-XXXX
    let formatted = "+1 "

    // Add area code with parentheses
    formatted += "("
    formatted += value.substring(0, Math.min(3, value.length))
    formatted += ")"

    if (value.length > 3) {
      formatted += "-"
      formatted += value.substring(3, Math.min(6, value.length))

      if (value.length > 6) {
        formatted += "-"
        formatted += value.substring(6, Math.min(10, value.length))
      }
    }

    return formatted
  }

  // Update the validateStep function to provide specific error messages for phone validation
  const validateStep = (day: keyof typeof counts, step: number) => {
    const currentForm = formData[day][step]
    const newErrors = { ...errors[day][step] }
    let isValid = true

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // First person form has more required fields
    if (step === 0) {
      if (!currentForm.name.trim()) {
        newErrors.name = true
        isValid = false
      }
      if (!currentForm.email.trim()) {
        newErrors.email = true
        isValid = false
      } else if (!emailRegex.test(currentForm.email)) {
        newErrors.email = true
        isValid = false
      }
      if (!currentForm.phone.trim()) {
        newErrors.phone = true
        isValid = false
      }
      if (!currentForm.about.trim()) {
        newErrors.about = true
        isValid = false
      }
    } else {
      // Friend forms only require name and about
      if (!currentForm.name.trim()) {
        newErrors.name = true
        isValid = false
      }
      if (!currentForm.about.trim()) {
        newErrors.about = true
        isValid = false
      }
    }

    // Update errors state
    setErrors((prev) => {
      const updatedErrors = [...prev[day]]
      updatedErrors[step] = newErrors
      return {
        ...prev,
        [day]: updatedErrors,
      }
    })

    return isValid
  }

  // Handle form submission
  const handleSubmit = async (day: keyof typeof counts) => {
    if (validateStep(day, currentStep[day])) {
      try {
        // Show loading state
        setIsSubmitting(true);
        
        // Send the data to our Flask server
        const response = await fetch('http://localhost:5001/api/rsvp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            day,
            formData: formData[day],
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit RSVP');
        }

        console.log(`Submit ${day} form successful:`, result);

        // Set submitted state to show success screen
        setSubmitted((prev) => ({
          ...prev,
          [day]: true,
        }));
      } catch (error) {
        console.error('Error submitting form:', error);
        setSubmissionError(
          error instanceof Error 
            ? error.message 
            : 'An error occurred while submitting your RSVP. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Animation classes based on isLoaded state
  // Update the titleClass to improve typography and spacing
  const titleClass = `mb-12 sm:mb-16 md:mb-20 text-center text-2xl sm:text-3xl md:text-4xl font-normal ${
    isLoaded ? "opacity-100 translate-y-0 transition-all duration-700 ease-out" : "opacity-0 -translate-y-4"
  }`

  // Improve spacing between image and content
  const imageClass = `mb-10 sm:mb-12 md:mb-16 overflow-hidden rounded-2xl ${
    isLoaded ? "opacity-100 translate-y-0 transition-all duration-700 delay-200 ease-out" : "opacity-0 -translate-y-4"
  }`

  // Increase spacing between date selectors for better visual separation
  const day1Class = `mb-10 ${
    isLoaded ? "opacity-100 translate-y-0 transition-all duration-700 delay-300 ease-out" : "opacity-0 translate-y-8"
  }`

  const day2Class = `mb-10 ${
    isLoaded ? "opacity-100 translate-y-0 transition-all duration-700 delay-400 ease-out" : "opacity-0 translate-y-8"
  }`

  const day3Class = `mb-10 ${
    isLoaded ? "opacity-100 translate-y-0 transition-all duration-700 delay-500 ease-out" : "opacity-0 translate-y-8"
  }`

  // Form animation variants
  const formVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      overflow: "hidden",
    },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: 16, // 4rem
      transition: {
        duration: 0.4,
        ease: [0.04, 0.62, 0.23, 0.98], // Custom easing function
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  }

  // Field animation variants
  const fieldVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      overflow: "hidden",
    },
    visible: {
      opacity: 1,
      height: "auto",
      marginBottom: 16,
      transition: {
        duration: 0.3,
        ease: [0.04, 0.62, 0.23, 0.98],
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  }

  // Success screen animation variants
  const successVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        staggerChildren: 0.15, // Reduced from 0.2
      },
    },
  }

  const sunVariants = {
    hidden: {
      opacity: 0,
      scale: 0.5,
      rotate: 0,
      y: 50, // Start position below center
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 360,
      y: 0, // Rise to final position
      transition: {
        opacity: { duration: 1.2, ease: "easeInOut" },
        scale: { duration: 1.5, ease: "easeInOut" },
        y: { duration: 1.8, ease: [0.16, 1, 0.3, 1] }, // Spring-like rise
        rotate: { duration: 20, ease: "linear", repeat: Number.POSITIVE_INFINITY },
      },
    },
  }

  const textVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9, // Slightly longer duration
        ease: "easeInOut", // Smoother easing
      },
    },
  }

  // Helper function to get the ordinal suffix
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) {
      return num + "st"
    }
    if (j === 2 && k !== 12) {
      return num + "nd"
    }
    if (j === 3 && k !== 13) {
      return num + "rd"
    }
    return num + "th"
  }

  // Helper function to get friend label
  const getFriendLabel = (index: number, totalCount: number) => {
    // If there are exactly 2 RSVPs total, use "your friend's name" for the second person
    if (index === 1 && totalCount === 2) {
      return "your friend's name"
    }
    // Otherwise use ordinal numbers (1st, 2nd, 3rd, etc.)
    return `your ${getOrdinalSuffix(index)} friend's name`
  }

  // Helper function to get day text for success screen
  const getDayText = (day: keyof typeof counts) => {
    let dayText = ""
    switch (day) {
      case "thursday":
        dayText = "thursday morning"
        break
      case "friday":
        dayText = "friday morning"
        break
      case "saturday":
        dayText = "saturday morning"
        break
      default:
        dayText = "morning"
        break
    }
    return dayText
  }

  // Render success screen
  const renderSuccessScreen = (day: keyof typeof counts) => {
    const name = formData[day][0]?.name.split(" ")[0] || "you"
    const dayText = getDayText(day)

    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-8 font-newsreader"
        initial="hidden"
        animate="visible"
        variants={successVariants}
      >
        <motion.div className="w-28 h-28 sm:w-36 sm:h-36 mb-10 sm:mb-16" variants={sunVariants}>
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AnecdoteSunDullvelvet-KPXOIJsivbOsxydv7fmN3BBtbl5W1g.png"
            alt="Anecdote sun logo"
            width={200}
            height={200}
            className="w-full h-full"
          />
        </motion.div>

        <motion.h1 className="text-4xl sm:text-5xl mb-10 sm:mb-16 tracking-tight" variants={textVariants}>
          {name}, you're in.
        </motion.h1>

        <motion.p className="text-xl sm:text-2xl mb-10 sm:mb-16 max-w-md leading-relaxed" variants={textVariants}>
          thank you so much for deciding to spend your {dayText} at <span className="text-[#542a31]">anecdote</span>.
        </motion.p>

        <motion.p className="text-lg sm:text-xl mb-10 sm:mb-16 max-w-md leading-relaxed" variants={textVariants}>
          please check your email for the address and other details
        </motion.p>

        <motion.p className="text-lg sm:text-xl mb-10 sm:mb-16 max-w-md leading-relaxed" variants={textVariants}>
          and don't hesitate to reach out to me @secondhandneel if you have any questions.
        </motion.p>

        <motion.p className="text-lg sm:text-xl leading-relaxed" variants={textVariants}>
          see you real soon ;)
        </motion.p>
      </motion.div>
    )
  }

  const increment = (day: keyof typeof counts) => {
    setCounts((prev) => ({
      ...prev,
      [day]: Math.min(prev[day] + 1, 5), // Limit to 5 guests
    }))
  }

  const decrement = (day: keyof typeof counts) => {
    setCounts((prev) => ({
      ...prev,
      [day]: Math.max(prev[day] - 1, 0),
    }))
  }

  const nextStep = (day: keyof typeof counts) => {
    if (validateStep(day, currentStep[day])) {
      setCurrentStep((prev) => ({
        ...prev,
        [day]: Math.min(prev[day] + 1, counts[day] - 1),
      }))
    }
  }

  const prevStep = (day: keyof typeof counts) => {
    setCurrentStep((prev) => ({
      ...prev,
      [day]: Math.max(prev[day] - 1, 0),
    }))
  }

  // Then modify the return statement to conditionally render based on isMounted
  // Add this right before the main return statement
  if (!isMounted) {
    // Return a minimal placeholder during SSR to prevent hydration issues
    return <div className="min-h-screen bg-[#eae9e4]"></div>
  }

  // Update the main container to have better padding and max-width for readability
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#eae9e4] overflow-x-hidden">
      <div className="w-full max-w-[90%] sm:max-w-md md:max-w-lg px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Check if any day is submitted to show the success screen */}
        {submitted.thursday ? (
          renderSuccessScreen("thursday")
        ) : submitted.friday ? (
          renderSuccessScreen("friday")
        ) : submitted.saturday ? (
          renderSuccessScreen("saturday")
        ) : (
          <>
            <h1 className={titleClass}>
              <span className="text-[#542a31]">anecdote</span> at <span className="text-black">verci</span>
            </h1>

            <div className={imageClass}>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Paintings-hEueGNJGPbkbBBFqj8YATtDG2XpDs2.webp"
                alt="Landscape painting with green forest and pink terrain by Edvard Munch"
                width={600}
                height={400}
                className="w-full"
                priority
              />
            </div>

            <div className="space-y-6">
              <div className={day1Class}>
                {isVerci ? (
                  <>
                    <DateSelector
                      day="thursday"
                      date="march 20"
                      count={counts.thursday}
                      onIncrement={() => increment("thursday")}
                      onDecrement={() => decrement("thursday")}
                    />

                    <AnimatePresence initial={false}>
                      {counts.thursday > 0 && (
                        <motion.div
                          key={`thursday-form-container`}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={formVariants}
                          className="space-y-4"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={`thursday-step-${currentStep.thursday}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                              className="space-y-4"
                            >
                              {currentStep.thursday === 0 ? (
                                // First person form
                                <>
                                  <FormField
                                    label="your name"
                                    value={formData.thursday[0]?.name || ""}
                                    onChange={(value) => handleInputChange("thursday", 0, "name", value)}
                                    error={errors.thursday[0]?.name}
                                    required
                                  />

                                  <AnimatePresence>
                                    <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                      <FormField
                                        label="email"
                                        type="email"
                                        value={formData.thursday[0]?.email || ""}
                                        onChange={(value) => handleInputChange("thursday", 0, "email", value)}
                                        error={errors.thursday[0]?.email}
                                        required
                                      />
                                    </motion.div>
                                  </AnimatePresence>

                                  <AnimatePresence>
                                    <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                      <FormField
                                        label="phone number"
                                        type="tel"
                                        value={formData.thursday[0]?.phone || ""}
                                        onChange={(value) => handleInputChange("thursday", 0, "phone", value)}
                                        error={errors.thursday[0]?.phone}
                                        errorMessage={phoneError}
                                        required
                                      />
                                    </motion.div>
                                  </AnimatePresence>

                                  <TextareaField
                                    label="tell me a little bit about yourself"
                                    placeholder="so that I can introduce you to people you'll vibe with:)"
                                    value={formData.thursday[0]?.about || ""}
                                    onChange={(value) => handleInputChange("thursday", 0, "about", value)}
                                    error={errors.thursday[0]?.about}
                                    required
                                  />
                                </>
                              ) : (
                                // Friend form
                                <>
                                  <FormField
                                    label={getFriendLabel(currentStep.thursday, counts.thursday)}
                                    value={formData.thursday[currentStep.thursday]?.name || ""}
                                    onChange={(value) => handleInputChange("thursday", currentStep.thursday, "name", value)}
                                    error={errors.thursday[currentStep.thursday]?.name}
                                    required
                                  />

                                  <TextareaField
                                    label="tell me a little bit about them"
                                    placeholder="so that I can introduce them to people they'll vibe with:)"
                                    value={formData.thursday[currentStep.thursday]?.about || ""}
                                    onChange={(value) => handleInputChange("thursday", currentStep.thursday, "about", value)}
                                    error={errors.thursday[currentStep.thursday]?.about}
                                    required
                                  />
                                </>
                              )}

                              <motion.div
                                className="flex gap-4"
                                layout
                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                              >
                                <AnimatePresence mode="popLayout">
                                  {currentStep.thursday > 0 && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                      className="rounded-md bg-[#cacaca] px-5 py-4 text-black font-medium w-[calc(50%-0.5rem)] hover:bg-[#b8b8b8] transition-colors duration-200"
                                      onClick={() => prevStep("thursday")}
                                    >
                                      back
                                    </motion.button>
                                  )}
                                </AnimatePresence>

                                <motion.button
                                  layout
                                  disabled={isSubmitting}
                                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                  className={`rounded-md bg-[#542a31] px-5 py-4 text-[#eae9e4] font-medium italic hover:bg-[#441f25] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                                    currentStep.thursday > 0 ? "w-[calc(50%-0.5rem)]" : "w-full"
                                  }`}
                                  onClick={() => {
                                    if (currentStep.thursday < counts.thursday - 1) {
                                      nextStep("thursday")
                                    } else {
                                      handleSubmit("thursday")
                                    }
                                  }}
                                >
                                  {isSubmitting ? "Submitting..." : currentStep.thursday < counts.thursday - 1 ? "next" : "rsvp"}
                                </motion.button>
                              </motion.div>
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <DisabledDateSelector
                    day="thursday"
                    date="march 20"
                    tooltipText="this day is reserved for verci members. if you're a member, please check your email for a separate rsvp link."
                  />
                )}
              </div>

              <div className={day2Class}>
                <DateSelector
                  day="friday"
                  date="march 21"
                  count={counts.friday}
                  onIncrement={() => increment("friday")}
                  onDecrement={() => decrement("friday")}
                />

                <AnimatePresence initial={false}>
                  {counts.friday > 0 && (
                    <motion.div
                      key={`friday-form-container`}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={formVariants}
                      className="space-y-4"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`friday-step-${currentStep.friday}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                          className="space-y-4"
                        >
                          {currentStep.friday === 0 ? (
                            // First person form
                            <>
                              <FormField
                                label="your name"
                                value={formData.friday[0]?.name || ""}
                                onChange={(value) => handleInputChange("friday", 0, "name", value)}
                                error={errors.friday[0]?.name}
                                required
                              />

                              <AnimatePresence>
                                <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                  <FormField
                                    label="email"
                                    type="email"
                                    value={formData.friday[0]?.email || ""}
                                    onChange={(value) => handleInputChange("friday", 0, "email", value)}
                                    error={errors.friday[0]?.email}
                                    required
                                  />
                                </motion.div>
                              </AnimatePresence>

                              <AnimatePresence>
                                <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                  <FormField
                                    label="phone number"
                                    type="tel"
                                    value={formData.friday[0]?.phone || ""}
                                    onChange={(value) => handleInputChange("friday", 0, "phone", value)}
                                    error={errors.friday[0]?.phone}
                                    errorMessage={phoneError} // Pass phoneError as errorMessage
                                    required
                                  />
                                </motion.div>
                              </AnimatePresence>

                              <TextareaField
                                label="tell me a little bit about yourself"
                                placeholder="so that I can introduce you to people you'll vibe with:)"
                                value={formData.friday[0]?.about || ""}
                                onChange={(value) => handleInputChange("friday", 0, "about", value)}
                                error={errors.friday[0]?.about}
                                required
                              />
                            </>
                          ) : (
                            // Friend form
                            <>
                              <FormField
                                label={getFriendLabel(currentStep.friday, counts.friday)}
                                value={formData.friday[currentStep.friday]?.name || ""}
                                onChange={(value) => handleInputChange("friday", currentStep.friday, "name", value)}
                                error={errors.friday[currentStep.friday]?.name}
                                required
                              />

                              <TextareaField
                                label="tell me a little bit about them"
                                placeholder="so that I can introduce them to people they'll vibe with:)"
                                value={formData.friday[currentStep.friday]?.about || ""}
                                onChange={(value) => handleInputChange("friday", currentStep.friday, "about", value)}
                                error={errors.friday[currentStep.friday]?.about}
                                required
                              />
                            </>
                          )}

                          <motion.div
                            className="flex gap-4"
                            layout
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                          >
                            <AnimatePresence mode="popLayout">
                              {currentStep.friday > 0 && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                  className="rounded-md bg-[#cacaca] px-5 py-4 text-black font-medium w-[calc(50%-0.5rem)] hover:bg-[#b8b8b8] transition-colors duration-200"
                                  onClick={() => prevStep("friday")}
                                >
                                  back
                                </motion.button>
                              )}
                            </AnimatePresence>

                            <motion.button
                              layout
                              disabled={isSubmitting}
                              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                              className={`rounded-md bg-[#542a31] px-5 py-4 text-[#eae9e4] font-medium italic hover:bg-[#441f25] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                                currentStep.friday > 0 ? "w-[calc(50%-0.5rem)]" : "w-full"
                              }`}
                              onClick={() => {
                                if (currentStep.friday < counts.friday - 1) {
                                  nextStep("friday")
                                } else {
                                  handleSubmit("friday")
                                }
                              }}
                            >
                              {isSubmitting ? "Submitting..." : currentStep.friday < counts.friday - 1 ? "next" : "rsvp"}
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Error message */}
                {submissionError && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
                    {submissionError}
                    <button 
                      className="ml-2 text-red-700 font-bold"
                      onClick={() => setSubmissionError('')}
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className={day3Class}>
                {isVerci ? (
                  <>
                    <DateSelector
                      day="saturday"
                      date="march 22"
                      count={counts.saturday}
                      onIncrement={() => increment("saturday")}
                      onDecrement={() => decrement("saturday")}
                    />

                    <AnimatePresence initial={false}>
                      {counts.saturday > 0 && (
                        <motion.div
                          key={`saturday-form-container`}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={formVariants}
                          className="space-y-4"
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                              key={`saturday-step-${currentStep.saturday}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                              className="space-y-4"
                            >
                              {currentStep.saturday === 0 ? (
                                // First person form
                                <>
                                  <FormField
                                    label="your name"
                                    value={formData.saturday[0]?.name || ""}
                                    onChange={(value) => handleInputChange("saturday", 0, "name", value)}
                                    error={errors.saturday[0]?.name}
                                    required
                                  />

                                  <AnimatePresence>
                                    <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                      <FormField
                                        label="email"
                                        type="email"
                                        value={formData.saturday[0]?.email || ""}
                                        onChange={(value) => handleInputChange("saturday", 0, "email", value)}
                                        error={errors.saturday[0]?.email}
                                        required
                                      />
                                    </motion.div>
                                  </AnimatePresence>

                                  <AnimatePresence>
                                    <motion.div initial="visible" animate="visible" exit="exit" variants={fieldVariants}>
                                      <FormField
                                        label="phone number"
                                        type="tel"
                                        value={formData.saturday[0]?.phone || ""}
                                        onChange={(value) => handleInputChange("saturday", 0, "phone", value)}
                                        error={errors.saturday[0]?.phone}
                                        errorMessage={phoneError}
                                        required
                                      />
                                    </motion.div>
                                  </AnimatePresence>

                                  <TextareaField
                                    label="tell me a little bit about yourself"
                                    placeholder="so that I can introduce you to people you'll vibe with:)"
                                    value={formData.saturday[0]?.about || ""}
                                    onChange={(value) => handleInputChange("saturday", 0, "about", value)}
                                    error={errors.saturday[0]?.about}
                                    required
                                  />
                                </>
                              ) : (
                                // Friend form
                                <>
                                  <FormField
                                    label={getFriendLabel(currentStep.saturday, counts.saturday)}
                                    value={formData.saturday[currentStep.saturday]?.name || ""}
                                    onChange={(value) => handleInputChange("saturday", currentStep.saturday, "name", value)}
                                    error={errors.saturday[currentStep.saturday]?.name}
                                    required
                                  />

                                  <TextareaField
                                    label="tell me a little bit about them"
                                    placeholder="so that I can introduce them to people they'll vibe with:)"
                                    value={formData.saturday[currentStep.saturday]?.about || ""}
                                    onChange={(value) => handleInputChange("saturday", currentStep.saturday, "about", value)}
                                    error={errors.saturday[currentStep.saturday]?.about}
                                    required
                                  />
                                </>
                              )}

                              <motion.div
                                className="flex gap-4"
                                layout
                                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                              >
                                <AnimatePresence mode="popLayout">
                                  {currentStep.saturday > 0 && (
                                    <motion.button
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                      className="rounded-md bg-[#cacaca] px-5 py-4 text-black font-medium w-[calc(50%-0.5rem)] hover:bg-[#b8b8b8] transition-colors duration-200"
                                      onClick={() => prevStep("saturday")}
                                    >
                                      back
                                    </motion.button>
                                  )}
                                </AnimatePresence>

                                <motion.button
                                  layout
                                  disabled={isSubmitting}
                                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                  className={`rounded-md bg-[#542a31] px-5 py-4 text-[#eae9e4] font-medium italic hover:bg-[#441f25] transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed ${
                                    currentStep.saturday > 0 ? "w-[calc(50%-0.5rem)]" : "w-full"
                                  }`}
                                  onClick={() => {
                                    if (currentStep.saturday < counts.saturday - 1) {
                                      nextStep("saturday")
                                    } else {
                                      handleSubmit("saturday")
                                    }
                                  }}
                                >
                                  {isSubmitting ? "Submitting..." : currentStep.saturday < counts.saturday - 1 ? "next" : "rsvp"}
                                </motion.button>
                              </motion.div>
                            </motion.div>
                          </AnimatePresence>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <DisabledDateSelector
                    day="saturday"
                    date="march 22"
                    tooltipText="unfortunately, this day is at capacity :/"
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Update the FormField component for better mobile responsiveness
function FormField({
  label,
  value,
  onChange,
  type = "text",
  error = false,
  required = false,
  errorMessage = "", // Add errorMessage prop with default empty string
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  error?: boolean
  required?: boolean
  errorMessage?: string // Add type for errorMessage
}) {
  const labelRef = useRef<HTMLSpanElement>(null)
  const [maxWidth, setMaxWidth] = useState<number | null>(null)

  useEffect(() => {
    if (labelRef.current) {
      // Get the width of the label + some padding
      const labelWidth = labelRef.current.getBoundingClientRect().width + 20
      setMaxWidth(labelWidth)
    }
  }, [label])

  // Determine if this is a phone field to show the specific error
  const isPhoneField = label === "phone number"

  return (
    <div className="space-y-1">
      <div
        className={`relative flex flex-col sm:flex-row items-start sm:items-center w-full rounded-md border ${
          error ? "border-[#542a31]" : "border-[#542a31]/30"
        } bg-transparent px-4 sm:px-5 py-3 sm:py-4 transition-colors duration-200`}
      >
        <span ref={labelRef} className="font-semibold text-[#542a31] flex-shrink-0 text-base mb-2 sm:mb-0">
          {label}
          {required && <span className="text-[#542a31] ml-1"></span>}
        </span>
        <div className="flex-grow relative w-full sm:w-auto sm:pl-8">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-none bg-transparent sm:text-right text-[#542a31] focus:outline-none focus:ring-0 text-base"
            aria-required={required}
            placeholder={isPhoneField ? "+1 (XXX)-XXX-XXXX" : ""}
          />
        </div>
      </div>
      {error && errorMessage && <p className="text-[#542a31] text-sm pl-4">{errorMessage}</p>}
    </div>
  )
}

interface TextareaFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  error?: boolean
  required?: boolean
}

// Update the TextareaField component for better mobile responsiveness
function TextareaField({ label, placeholder, value, onChange, error = false, required = false }: TextareaFieldProps) {
  return (
    <div
      className={`relative w-full rounded-md border ${
        error ? "border-[#542a31]" : "border-[#542a31]/30"
      } bg-transparent p-4 sm:p-5 transition-colors duration-200`}
    >
      <span className="font-semibold text-[#542a31] text-base">
        {label}
        {required && <span className="text-[#542a31] ml-1"></span>}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-3 w-full resize-none border-none bg-transparent p-0 text-[#542a31] placeholder:text-[#542a31]/50 focus:outline-none focus:ring-0 text-base"
        rows={3}
        aria-required={required}
      ></textarea>
    </div>
  )
}

interface DateSelectorProps {
  day: string
  date: string
  count: number
  onIncrement: () => void
  onDecrement: () => void
}

// Update the DateSelector component for better mobile responsiveness
function DateSelector({ day, date, count, onIncrement, onDecrement }: DateSelectorProps) {
  // Track the previous count to determine animation direction
  const prevCountRef = useRef(count)
  const [direction, setDirection] = useState<"up" | "down">("up")

  useEffect(() => {
    // Determine animation direction based on value change
    if (count > prevCountRef.current) {
      setDirection("up")
    } else if (count < prevCountRef.current) {
      setDirection("down")
    }

    // Update the previous count reference
    prevCountRef.current = count
  }, [count, day])

  return (
    <div className="flex items-center justify-between py-2 w-full min-w-0 group">
      <div className="flex-shrink min-w-0 pr-2">
        <span className="text-[#542a31] text-xl sm:text-2xl font-medium truncate group-hover:text-[#542a31]/80 transition-colors">{day}</span>{" "}
        <span className="text-black text-xl sm:text-2xl font-normal truncate">{date}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-lg bg-[#cacaca] text-black hover:bg-[#b8b8b8] active:bg-[#b0b0b0] transition-colors duration-200"
          onClick={onDecrement}
          aria-label={`Decrease ${day} count`}
          disabled={count === 0}
        >
          <Minus size={18} className="sm:hidden" />
          <Minus size={20} className="hidden sm:block" />
        </button>
        <MotionCounter value={count} direction={direction} />
        <button
          className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-lg bg-[#cacaca] text-black hover:bg-[#b8b8b8] active:bg-[#b0b0b0] transition-colors duration-200"
          onClick={onIncrement}
          aria-label={`Increase ${day} count`}
        >
          <Plus size={18} className="sm:hidden" />
          <Plus size={20} className="hidden sm:block" />
        </button>
      </div>
    </div>
  )
}

interface MotionCounterProps {
  value: number
  direction: "up" | "down"
}

function MotionCounter({ value, direction }: MotionCounterProps) {
  // Animation variants based on direction
  const variants = {
    initial: {
      y: direction === "up" ? 20 : -20,
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: direction === "up" ? -20 : 20,
      opacity: 0,
      // Using CSS transform instead of position for animation
      transform: `translateY(${direction === "up" ? -20 : 20}px)`,
    },
  } as const

  return (
    <div className="w-6 sm:w-7 h-8 flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
            mass: 1,
          }}
          className="text-xl sm:text-2xl font-medium"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

// Update the DisabledDateSelector component to reposition and restyle the tooltip
function DisabledDateSelector({ day, date, tooltipText }: { day: string; date: string; tooltipText: string }) {
  // Use AnimatePresence and motion for consistent animation
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  // Define tooltip animation variants for consistent slide-in from right
  const tooltipVariants = {
    hidden: {
      opacity: 0,
      x: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 30,
      },
    },
  }

  return (
    <div className="flex items-center justify-between py-2 relative">
      <div>
        <span className="text-gray-400 text-xl sm:text-2xl font-medium">{day}</span>{" "}
        <span className="text-gray-400 text-xl sm:text-2xl font-normal">{date}</span>
      </div>
      <div className="relative">
        <div
          className="text-gray-400 text-sm font-medium transition-colors duration-200 hover:text-[#542a31] cursor-help"
          onMouseEnter={() => setIsTooltipVisible(true)}
          onMouseLeave={() => setIsTooltipVisible(false)}
          aria-describedby={`tooltip-${day}`}
        >
          UNAVAILABLE
        </div>

        <AnimatePresence>
          {isTooltipVisible && (
            <motion.div
              id={`tooltip-${day}`}
              className="absolute left-full ml-4 p-4 border border-dotted border-[#542a31] rounded-md shadow-md
                bg-[#eae9e4] text-[#542a31] text-sm whitespace-normal z-30
                min-w-[200px] max-w-[400px] break-words"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={tooltipVariants}
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                width: "max-content",
                maxWidth: "min(400px, calc(100vw - 100px))",
              }}
            >
              {tooltipText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

