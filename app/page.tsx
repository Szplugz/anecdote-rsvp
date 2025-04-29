"use client";

import Image from "next/image";
import { Minus, Plus, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [counts, setCounts] = useState({
    thursday: 0,
    friday: 0,
    saturday: 0,
  });

  // Track the current form step for each day
  const [currentStep, setCurrentStep] = useState({
    thursday: 0,
    friday: 0,
    saturday: 0,
  });

  const [formData, setFormData] = useState({
    thursday: [
      { name: "", email: "", phone: "", about: "", guestType: "Primary" },
    ],
    friday: [
      { name: "", email: "", phone: "", about: "", guestType: "Primary" },
    ],
    saturday: [
      { name: "", email: "", phone: "", about: "", guestType: "Primary" },
    ],
  });

  // Track validation errors
  const [errors, setErrors] = useState({
    thursday: [{ name: false, email: false, phone: false, about: false }],
    friday: [{ name: false, email: false, phone: false, about: false }],
    saturday: [{ name: false, email: false, phone: false, about: false }],
  });

  // Track submission status
  const [submitted, setSubmitted] = useState({
    thursday: false,
    friday: false,
    saturday: false,
  });

  // Add this at the beginning of the component, right after the state declarations
  // This ensures the component renders in the correct initial state on the client
  const [isMounted, setIsMounted] = useState(false);

  // Add a state for phone error message
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add state to control blur animation
  const [startBlurAnimation, setStartBlurAnimation] = useState(false);

  // Reference to the invitation card for downloading
  const invitationCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set isLoaded to true after component mounts
  useEffect(() => {
    // Delay setting isLoaded to true to ensure animations work properly
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Update the useEffect for blur animation timing to use a more reliable approach
  useEffect(() => {
    if (isLoaded) {
      // Wait for other animations to complete (700ms duration + 500ms max delay) + 3 seconds extra
      const timer = setTimeout(() => {
        setStartBlurAnimation(true);
      }, 1000); // 700ms + 500ms + 3000ms

      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Update form data array when count changes
  useEffect(() => {
    const updateFormData = (day: keyof typeof counts) => {
      const count = counts[day];
      setFormData((prev) => {
        const currentForms = [...prev[day]];

        // If we need more forms, add them
        if (currentForms.length < count) {
          const newForms = Array(count - currentForms.length)
            .fill(null)
            .map(() => ({
              name: "",
              email: "",
              phone: "",
              about: "",
            }));
          return {
            ...prev,
            [day]: [...currentForms, ...newForms],
          };
        }

        // If we need fewer forms, remove them
        if (currentForms.length > count && count > 0) {
          return {
            ...prev,
            [day]: currentForms.slice(0, count),
          };
        }

        return prev;
      });

      // Update errors array to match form data
      setErrors((prev) => {
        const currentErrors = [...prev[day]];

        if (currentErrors.length < count) {
          const newErrors = Array(count - currentErrors.length)
            .fill(null)
            .map(() => ({
              name: false,
              email: false,
              phone: false,
              about: false,
            }));
          return {
            ...prev,
            [day]: [...currentErrors, ...newErrors],
          };
        }

        if (currentErrors.length > count && count > 0) {
          return {
            ...prev,
            [day]: currentErrors.slice(0, count),
          };
        }

        return prev;
      });

      // Reset to first step if count is reduced below current step
      if (count <= currentStep[day]) {
        setCurrentStep((prev) => ({
          ...prev,
          [day]: Math.max(0, count - 1),
        }));
      }
    };

    updateFormData("thursday");
    updateFormData("friday");
    updateFormData("saturday");
  }, [counts]);

  // Modify the handleInputChange function to handle phone number formatting correctly
  const handleInputChange = (
    day: keyof typeof counts,
    step: number,
    field: string,
    value: string
  ) => {
    // Special handling for phone number
    if (field === "phone") {
      // If the user is deleting and the value is just "+1 " or "+1", reset to empty
      if (value === "+1 " || value === "+1" || value === "+") {
        setFormData((prev) => {
          const updatedForms = [...prev[day]];
          if (updatedForms[step]) {
            updatedForms[step] = {
              ...updatedForms[step],
              [field]: "",
            };
          }
          return {
            ...prev,
            [day]: updatedForms,
          };
        });
        return;
      }

      // Extract just the digits from the input
      let digitsOnly = value.replace(/\D/g, "");

      // If the value starts with "1" and it's coming from our formatting, remove it
      if (value.startsWith("+1") && digitsOnly.startsWith("1")) {
        digitsOnly = digitsOnly.substring(1);
      }

      // Limit to 10 digits
      digitsOnly = digitsOnly.substring(0, 10);

      // Format the phone number
      const formattedValue = formatPhoneNumber(digitsOnly);

      setFormData((prev) => {
        const updatedForms = [...prev[day]];
        if (updatedForms[step]) {
          updatedForms[step] = {
            ...updatedForms[step],
            [field]: formattedValue,
          };
        }
        return {
          ...prev,
          [day]: updatedForms,
        };
      });

      // Clear phone error when user types
      if (phoneError) {
        setPhoneError("");
      }
    } else {
      // Handle other fields normally
      setFormData((prev) => {
        const updatedForms = [...prev[day]];
        if (updatedForms[step]) {
          updatedForms[step] = {
            ...updatedForms[step],
            [field]: value,
          };
        }
        return {
          ...prev,
          [day]: updatedForms,
        };
      });
    }

    // Clear error when user types
    if (
      errors[day][step] &&
      errors[day][step][field as keyof (typeof errors)[day][0]]
    ) {
      setErrors((prev) => {
        const updatedErrors = [...prev[day]];
        updatedErrors[step] = {
          ...updatedErrors[step],
          [field]: false,
        };
        return {
          ...prev,
          [day]: updatedErrors,
        };
      });
    }
  };

  // Update the formatPhoneNumber function to be more consistent
  const formatPhoneNumber = (value: string): string => {
    // If empty, return empty string
    if (!value || value.length === 0) return "";

    // Format: +1 (XXX)-XXX-XXXX
    let formatted = "+1 ";

    // Add area code with parentheses
    formatted += "(";
    formatted += value.substring(0, Math.min(3, value.length));
    formatted += ")";

    if (value.length > 3) {
      formatted += "-";
      formatted += value.substring(3, Math.min(6, value.length));

      if (value.length > 6) {
        formatted += "-";
        formatted += value.substring(6, Math.min(10, value.length));
      }
    }

    return formatted;
  };

  // Update the validateStep function to provide specific error messages for phone validation
  const validateStep = (day: keyof typeof counts, step: number) => {
    const currentForm = formData[day][step];
    const newErrors = { ...errors[day][step] };
    let isValid = true;

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // First person form has more required fields
    if (step === 0) {
      if (!currentForm.name.trim()) {
        newErrors.name = true;
        isValid = false;
      }
      if (!currentForm.email.trim()) {
        newErrors.email = true;
        isValid = false;
      } else if (!emailRegex.test(currentForm.email)) {
        newErrors.email = true;
        isValid = false;
      }
      if (!currentForm.phone.trim()) {
        newErrors.phone = true;
        isValid = false;
      }
      if (!currentForm.about.trim()) {
        newErrors.about = true;
        isValid = false;
      }
    } else {
      // Friend forms only require name and about
      if (!currentForm.name.trim()) {
        newErrors.name = true;
        isValid = false;
      }
      if (!currentForm.about.trim()) {
        newErrors.about = true;
        isValid = false;
      }
    }

    // Update errors state
    setErrors((prev) => {
      const updatedErrors = [...prev[day]];
      updatedErrors[step] = newErrors;
      return {
        ...prev,
        [day]: updatedErrors,
      };
    });

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (day: keyof typeof counts) => {
    if (validateStep(day, currentStep[day])) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/rsvp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData[day][0],
            day: day,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to submit RSVP");
        }

        // Set submitted state to show success screen
        setSubmitted((prev) => ({
          ...prev,
          [day]: true,
        }));

        // Scroll to top of the page
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Error submitting RSVP:", error);
        alert(error instanceof Error ? error.message : "Failed to submit RSVP");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to download the invitation card as an image
  const downloadInvitationCard = async () => {
    if (!invitationCardRef.current) return;

    try {
      // Set a loading state if needed
      // setIsDownloading(true)

      // Wait a moment to ensure images are fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(invitationCardRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true, // Enable CORS for images
        allowTaint: true, // Allow cross-origin images
        imageTimeout: 15000, // Increase timeout for image loading
        onclone: (documentClone) => {
          // Find all images in the cloned document and mark them as loaded
          const images = documentClone.querySelectorAll("img");
          images.forEach((img) => {
            img.setAttribute("crossorigin", "anonymous");
            // Force image to be treated as loaded
            if (img.complete) {
              const event = new Event("load");
              img.dispatchEvent(event);
            }
          });
        },
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "anecdote-invitation.png";
      link.click();
    } catch (error) {
      console.error("Error generating invitation card:", error);
    } finally {
      // Reset loading state if needed
      // setIsDownloading(false)
    }
  };

  // Animation classes based on isLoaded state
  // Update the titleClass to improve typography and spacing
  const titleClass = `mb-12 sm:mb-16 md:mb-20 text-center text-3xl sm:text-4xl md:text-5xl font-normal ${
    isLoaded
      ? "opacity-100 translate-y-0 transition-all duration-700 ease-out"
      : "opacity-0 -translate-y-4"
  }`;

  // Improve spacing between image and content
  const imageClass = `mb-10 sm:mb-12 md:mb-16 overflow-hidden rounded-2xl ${
    isLoaded
      ? "opacity-100 translate-y-0 transition-all duration-700 delay-200 ease-out"
      : "opacity-0 -translate-y-4"
  }`;

  // Increase spacing between date selectors for better visual separation
  const day1Class = `mb-10 ${
    isLoaded
      ? "opacity-100 translate-y-0 transition-all duration-700 delay-300 ease-out"
      : "opacity-0 translate-y-8"
  }`;

  const day2Class = `mb-10 ${
    isLoaded
      ? "opacity-100 translate-y-0 transition-all duration-700 delay-400 ease-out"
      : "opacity-0 translate-y-8"
  }`;

  const day3Class = `mb-10 ${
    isLoaded
      ? "opacity-100 translate-y-0 transition-all duration-700 delay-500 ease-out"
      : "opacity-0 translate-y-8"
  }`;

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
  };

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
  };

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
        staggerChildren: 0.15,
      },
    },
  };

  // Name animation variants - appears first
  const nameVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: "easeInOut",
      },
    },
  };

  // "You're in!" text animation variants - appears 1 second after name
  const youreInVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: "easeInOut",
        delay: 1, // 1 second delay after name appears
      },
    },
  };

  // Update the text variants to appear after "you're in!"
  const textVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: "easeInOut",
        delay: 2, // Delay after "you're in!" appears (1s + 1s)
      },
    },
  };

  // Update the card variants to appear last
  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1], // Spring-like animation
        delay: 2.8, // Delay after text appears (2s + 0.8s)
      },
    },
  };

  // Update the button variants to appear after the card
  const buttonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
        delay: 4, // Delay after card appears (2.8s + 1.2s)
      },
    },
  };

  // Helper function to get the ordinal suffix
  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return num + "st";
    }
    if (j === 2 && k !== 12) {
      return num + "nd";
    }
    if (j === 3 && k !== 13) {
      return num + "rd";
    }
    return num + "th";
  };

  // Helper function to get friend label
  const getFriendLabel = (index: number, totalCount: number) => {
    // If there are exactly 2 RSVPs total, use "your friend's name" for the second person
    if (index === 1 && totalCount === 2) {
      return "your friend's name";
    }
    // Otherwise use ordinal numbers (1st, 2nd, 3rd, etc.)
    return `your ${getOrdinalSuffix(index)} friend's name`;
  };

  // Helper function to get day text for success screen
  const getDayText = (day: keyof typeof counts) => {
    let dayText = "";
    switch (day) {
      case "thursday":
        dayText = "thursday morning";
        break;
      case "friday":
        dayText = "sunday morning";
        break;
      case "saturday":
        dayText = "saturday morning";
        break;
      default:
        dayText = "morning";
        break;
    }
    return dayText;
  };

  // Render new success screen with invitation card
  const renderSuccessScreen = (day: keyof typeof counts) => {
    const firstName = formData[day][0]?.name.split(" ")[0] || "you";
    const fullName = formData[day][0]?.name || "Guest";
    const dayText = getDayText(day);
    const eventDate = day === "friday" ? "may 4, 2025" : "may 5, 2025";

    return (
      <motion.div
        className="flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-8 py-8 sm:py-12"
        initial="hidden"
        animate="visible"
        variants={successVariants}
      >
        <h1 className="text-4xl sm:text-5xl mb-6 sm:mb-8 tracking-tight flex items-center justify-center">
          <motion.span className="font-medium" variants={nameVariants}>
            {firstName}
          </motion.span>
          <motion.span variants={youreInVariants}>, you're in!</motion.span>
        </h1>

        <motion.p
          className="text-xl sm:text-2xl mb-6 sm:mb-8 max-w-md leading-relaxed"
          variants={textVariants}
        >
          thank you so much for deciding to spend your {dayText} at <br></br>
          <a href="https://www.google.com/maps/place/213+N+Morgan+St,+Chicago,+IL+60607/@41.8860447,-87.6529453,17.93z/data=!4m6!3m5!1s0x880e2cd098c72783:0x6a16ba9e89a31a57!8m2!3d41.8861755!4d-87.6518296!16s%2Fg%2F11bw3f9yfv?entry=ttu&g_ep=EgoyMDI1MDQyMy4wIKXMDSoASAFQAw%3D%3D">
            <span className="text-[#542a31] italic underline decoration-dotted">
              past studies
            </span>
          </a>
          .
        </motion.p>

        <motion.p
          className="text-xl sm:text-2xl mb-10 sm:mb-16 max-w-md leading-relaxed"
          variants={textVariants}
        >
          here's your personal invitation card <br />- it's yours to keep
          forever :)
        </motion.p>

        {/* Invitation Card */}
        <motion.div
          ref={invitationCardRef}
          className="w-full max-w-sm bg-[#eae9e4] rounded-lg overflow-hidden mb-10 relative"
          variants={cardVariants}
          style={{
            boxShadow:
              "0 10px 25px rgba(84, 42, 49, 0.2), 0 6px 12px rgba(84, 42, 49, 0.15)",
            animation: "float 6s ease-in-out infinite",
          }}
        >
          {/* Card Content */}
          <div className="p-6 pb-12">
            {/* Rothko-style painting */}
            <div className="mb-6">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Anecdote%20Stickers%20Group%204-RsvZTNk6Ko6K1V8dXLVf3377fVCfph.png"
                alt="Abstract painting"
                width={400}
                height={300}
                className="w-full h-auto"
                crossOrigin="anonymous"
              />
            </div>

            {/* Name */}
            <h2 className="text-2xl font-medium text-center mb-8 italic">
              {fullName}
            </h2>

            {/* Event Details */}
            <div className="flex justify-between text-sm mb-8">
              <div className="text-left">anecdote</div>
              <div className="text-center">{eventDate}</div>
              <div className="text-right">homebody</div>
            </div>
            <div className="text-center text-sm mb-6">
              past studies, chicago
            </div>
          </div>

          {/* Sun Logo - positioned fully within the card with no overflow */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AnecdoteHalfSunDullVelvet-BvjffBZeGMw0NZDYU1cCwjqybCLdG0.png"
              alt="Anecdote sun logo"
              width={60}
              height={30}
              className="w-16 h-auto"
              crossOrigin="anonymous"
            />
          </div>
        </motion.div>

        {/* Download Button */}
        <motion.button
          onClick={downloadInvitationCard}
          className="flex items-center gap-2 rounded-md bg-[#542a31] px-5 py-3 text-[#eae9e4] text-sm font-medium hover:bg-[#441f25] transition-colors duration-200"
          variants={buttonVariants}
        >
          <Download size={16} />
          Download Invitation
        </motion.button>
      </motion.div>
    );
  };

  const increment = (day: keyof typeof counts) => {
    setCounts((prev) => ({
      ...prev,
      [day]: Math.min(prev[day] + 1, 5), // Limit to 5 guests
    }));
  };

  const decrement = (day: keyof typeof counts) => {
    setCounts((prev) => ({
      ...prev,
      [day]: Math.max(prev[day] - 1, 0),
    }));
  };

  const nextStep = (day: keyof typeof counts) => {
    if (validateStep(day, currentStep[day])) {
      setCurrentStep((prev) => ({
        ...prev,
        [day]: Math.min(prev[day] + 1, counts[day] - 1),
      }));
    }
  };

  const prevStep = (day: keyof typeof counts) => {
    setCurrentStep((prev) => ({
      ...prev,
      [day]: Math.max(prev[day] - 1, 0),
    }));
  };

  // Then modify the return statement to conditionally render based on isMounted
  // Add this right before the main return statement
  if (!isMounted) {
    // Return a minimal placeholder during SSR to prevent hydration issues
    return <div className="min-h-screen bg-[#eae9e4]"></div>;
  }

  // Update the main container to have better padding and max-width for readability
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#eae9e4] px-4 sm:px-6 py-8 sm:py-12 md:py-16">
      <div className="w-full max-w-[90%] sm:max-w-md md:max-w-lg">
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
              <span className="text-[#542a31]">anecdote</span> at{" "}
              <span className="text-black">verci</span>
            </h1>

            <div className={imageClass}>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Painted%20Scapes.jpg-WQA2qjCwosdPWtiH5EvoGYbySN0Qxj.jpeg"
                alt="Claude Monet painting of a garden lunch scene with a white tablecloth and flowers"
                width={600}
                height={400}
                className="w-full"
                priority
              />
            </div>

            {/* Update the paragraph section to only apply blur to the main paragraph text */}
            <div
              className={`mb-10 sm:mb-12 md:mb-16 text-center sm:text-left ${
                isLoaded
                  ? "opacity-100 translate-y-0 transition-all duration-700 delay-250 ease-out"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <h2
                className={`text-lg text-left sm:text-lg text-[#949494] mb-6 blurred-text ${
                  startBlurAnimation ? "unblurred" : ""
                }`}
              >
                spring is here!
              </h2>
              <p className="text-lg text-left sm:text-lg leading-relaxed mb-8">
                <span
                  className={`text-[#949494] blurred-text ${
                    startBlurAnimation ? "unblurred" : ""
                  }`}
                >
                  to mark the beginning of a new season,{" "}
                </span>
                <span className="text-[#542a31] italic">anecdote</span>
                <span
                  className={`text-[#949494] blurred-text ${
                    startBlurAnimation ? "unblurred" : ""
                  }`}
                >
                  , in association with the lovely folks from{" "}
                </span>
                <span className="text-[#542a31] italic">homebody</span>
                <span
                  className={`text-[#949494] blurred-text ${
                    startBlurAnimation ? "unblurred" : ""
                  }`}
                >
                  , would like to extend a warm invitation to the beautiful
                  people of chicago to come celebrate this fantastic weather at{" "}
                </span>
                <span className="text-[#542a31] italic">past studies</span>
                <span
                  className={`text-[#949494] blurred-text ${
                    startBlurAnimation ? "unblurred" : ""
                  }`}
                >
                  {" "}
                  over some decadent iced coffee and delicious ceremonial
                  matcha.
                </span>
              </p>
            </div>

            <div className="space-y-6">
              <div className={day2Class}>
                <DateSelector
                  day="sunday"
                  date="may 4"
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
                          transition={{
                            duration: 0.3,
                            ease: [0.04, 0.62, 0.23, 0.98],
                          }}
                          className="space-y-4"
                        >
                          {currentStep.friday === 0 ? (
                            // First person form
                            <>
                              <FormField
                                label="your name"
                                value={formData.friday[0]?.name || ""}
                                onChange={(value) =>
                                  handleInputChange("friday", 0, "name", value)
                                }
                                error={errors.friday[0]?.name}
                                required
                              />

                              <AnimatePresence>
                                <motion.div
                                  initial="visible"
                                  animate="visible"
                                  exit="exit"
                                  variants={fieldVariants}
                                >
                                  <FormField
                                    label="email"
                                    type="email"
                                    value={formData.friday[0]?.email || ""}
                                    onChange={(value) =>
                                      handleInputChange(
                                        "friday",
                                        0,
                                        "email",
                                        value
                                      )
                                    }
                                    error={errors.friday[0]?.email}
                                    required
                                  />
                                </motion.div>
                              </AnimatePresence>

                              <AnimatePresence>
                                <motion.div
                                  initial="visible"
                                  animate="visible"
                                  exit="exit"
                                  variants={fieldVariants}
                                >
                                  <FormField
                                    label="phone number"
                                    type="tel"
                                    value={formData.friday[0]?.phone || ""}
                                    onChange={(value) =>
                                      handleInputChange(
                                        "friday",
                                        0,
                                        "phone",
                                        value
                                      )
                                    }
                                    error={errors.friday[0]?.phone}
                                    errorMessage={phoneError}
                                    required
                                  />
                                </motion.div>
                              </AnimatePresence>

                              <TextareaField
                                label="tell me a little bit about yourself"
                                placeholder="so that I can introduce you to people you'll vibe with:)"
                                value={formData.friday[0]?.about || ""}
                                onChange={(value) =>
                                  handleInputChange("friday", 0, "about", value)
                                }
                                error={errors.friday[0]?.about}
                                required
                              />
                            </>
                          ) : (
                            // Friend form
                            <>
                              <FormField
                                label={getFriendLabel(
                                  currentStep.friday,
                                  counts.friday
                                )}
                                value={
                                  formData.friday[currentStep.friday]?.name ||
                                  ""
                                }
                                onChange={(value) =>
                                  handleInputChange(
                                    "friday",
                                    currentStep.friday,
                                    "name",
                                    value
                                  )
                                }
                                error={errors.friday[currentStep.friday]?.name}
                                required
                              />

                              <TextareaField
                                label="tell me a little bit about them"
                                placeholder="so that I can introduce them to people they'll vibe with:)"
                                value={
                                  formData.friday[currentStep.friday]?.about ||
                                  ""
                                }
                                onChange={(value) =>
                                  handleInputChange(
                                    "friday",
                                    currentStep.friday,
                                    "about",
                                    value
                                  )
                                }
                                error={errors.friday[currentStep.friday]?.about}
                                required
                              />
                            </>
                          )}

                          <motion.div
                            className="flex gap-4"
                            layout
                            transition={{
                              duration: 0.3,
                              ease: [0.04, 0.62, 0.23, 0.98],
                            }}
                          >
                            <AnimatePresence mode="popLayout">
                              {currentStep.friday > 0 && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: [0.04, 0.62, 0.23, 0.98],
                                  }}
                                  className="rounded-md bg-[#cacaca] px-5 py-4 text-black font-medium w-[calc(50%-0.5rem)] hover:bg-[#b8b8b8] transition-colors duration-200"
                                  onClick={() => prevStep("friday")}
                                >
                                  back
                                </motion.button>
                              )}
                            </AnimatePresence>

                            <motion.button
                              layout
                              transition={{
                                duration: 0.3,
                                ease: [0.04, 0.62, 0.23, 0.98],
                              }}
                              className={`rounded-md bg-[#542a31] px-5 py-4 text-[#eae9e4] font-medium italic hover:bg-[#441f25] transition-colors duration-200 ${
                                currentStep.friday > 0
                                  ? "w-[calc(50%-0.5rem)]"
                                  : "w-full"
                              }`}
                              onClick={() => {
                                if (currentStep.friday < counts.friday - 1) {
                                  nextStep("friday");
                                } else {
                                  handleSubmit("friday");
                                }
                              }}
                              disabled={isLoading}
                            >
                              {currentStep.friday < counts.friday - 1 ? (
                                "next"
                              ) : isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Submitting...</span>
                                </div>
                              ) : (
                                "rsvp"
                              )}
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
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
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: boolean;
  required?: boolean;
  errorMessage?: string; // Add type for errorMessage
}) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);

  useEffect(() => {
    if (labelRef.current) {
      // Get the width of the label + some padding
      const labelWidth = labelRef.current.getBoundingClientRect().width + 20;
      setMaxWidth(labelWidth);
    }
  }, [label]);

  // Determine if this is a phone field to show the specific error
  const isPhoneField = label === "phone number";

  return (
    <div className="space-y-1">
      <div
        className={`relative flex flex-col sm:flex-row items-start sm:items-center w-full rounded-md border ${
          error ? "border-[#542a31]" : "border-[#542a31]/30"
        } bg-transparent px-4 sm:px-5 py-3 sm:py-4 transition-colors duration-200`}
      >
        <span
          ref={labelRef}
          className="font-semibold text-[#542a31] flex-shrink-0 text-base mb-2 sm:mb-0"
        >
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
      {error && errorMessage && (
        <p className="text-[#542a31] text-sm pl-4">{errorMessage}</p>
      )}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  required?: boolean;
}

// Update the TextareaField component for better mobile responsiveness
function TextareaField({
  label,
  placeholder,
  value,
  onChange,
  error = false,
  required = false,
}: TextareaFieldProps) {
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
  );
}

// Update the DateSelectorProps interface to remove the startBlurAnimation prop
interface DateSelectorProps {
  day: string;
  date: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

// Update the DateSelector component to remove the blur effect
function DateSelector({
  day,
  date,
  count,
  onIncrement,
  onDecrement,
}: DateSelectorProps) {
  // Track the previous count to determine animation direction
  const prevCountRef = useRef(count);
  const [direction, setDirection] = useState<"up" | "down">("up");

  useEffect(() => {
    // Determine animation direction based on value change
    if (count > prevCountRef.current) {
      setDirection("up");
    } else if (count < prevCountRef.current) {
      setDirection("down");
    }

    // Update the previous count reference
    prevCountRef.current = count;
  }, [count, day]);

  return (
    <div className="flex flex-row sm:flex-row sm:items-center justify-between py-2 gap-3 sm:gap-0">
      <div>
        <span className="text-[#542a31] text-xl sm:text-2xl font-medium">
          {day}
        </span>{" "}
        <span className="text-black text-xl sm:text-2xl font-normal">
          {date}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-lg bg-[#cacaca] text-black hover:bg-[#b8b8b8] transition-colors duration-200"
          onClick={onDecrement}
          aria-label={`Decrease ${day} count`}
        >
          <Minus size={18} className="sm:hidden" />
          <Minus size={20} className="hidden sm:block" />
        </button>
        <MotionCounter value={count} direction={direction} />
        <button
          className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-lg bg-[#cacaca] text-black hover:bg-[#b8b8b8] transition-colors duration-200"
          onClick={onIncrement}
          aria-label={`Increase ${day} count`}
        >
          <Plus size={18} className="sm:hidden" />
          <Plus size={20} className="hidden sm:block" />
        </button>
      </div>
    </div>
  );
}

interface MotionCounterProps {
  value: number;
  direction: "up" | "down";
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
      position: "absolute",
    },
  };

  return (
    <div className="w-6 h-8 flex items-center justify-center overflow-hidden relative">
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
          className="text-2xl font-medium"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Update the DisabledDateSelector component to reposition and restyle the tooltip
function DisabledDateSelector({
  day,
  date,
  tooltipText,
}: {
  day: string;
  date: string;
  tooltipText: string;
}) {
  // Use AnimatePresence and motion for consistent animation
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

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
  };

  return (
    <div className="flex items-center justify-between py-2 relative">
      <div>
        <span className="text-[#949494] text-2xl font-medium">{day}</span>{" "}
        <span className="text-[#949494] text-2xl font-normal">{date}</span>
      </div>
      <div className="relative">
        <div
          className="text-[#949494] text-sm font-medium transition-colors duration-200 hover:text-[#542a31] cursor-help"
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
  );
}
