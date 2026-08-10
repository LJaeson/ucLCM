import { useState, useCallback, useEffect } from 'react';
import "tailwindcss";

const ADDRESS = import.meta.env.VITE_ADDRESS;

const STARS = [1, 2, 3, 4, 5];

export default function Rating() {
//   const [isExpanded, setIsExpanded] = useState(false);

  // question 1 is the only compulsory one
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [message2, setMessage2] = useState('');
  const [message3, setMessage3] = useState('');

  const [ratingError, setRatingError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [submittedTitle, setSubmittedTitle] = useState("");

  const textQuestions = [
    { label: "What was the most helpful part of the session?", value: message, setValue: setMessage },
    { label: "What could we do better?", value: message2, setValue: setMessage2 },
    { label: "Anything else you'd like to share?", value: message3, setValue: setMessage3 },
  ];


  // used to fetch if the feedback and feedback is already in the server
  const fetchFeedbackStatus = useCallback(async () => {
      try {
          const response = await fetch(`${ADDRESS}/status/feedback`, {
              method: "GET",
              credentials: "include", 
          });

          if (response.ok) {
              const data = await response.json();
              
              if (data.recorded) {
                setIsSubmitted(true);
              }
          }
      } catch (error) {
          console.error("Could not fetch feedback status:", error);
      }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        await fetchFeedbackStatus();
    };

    loadInitialData();
  }, [fetchFeedbackStatus]);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (rating === 0) {
      setRatingError("Please tap a star to rate the session.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${ADDRESS}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating: rating,
          message: message.trim() || null,
          message2: message2.trim() || null,
          message3: message3.trim() || null,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success") {
          setSubmittedTitle("Thank you!");
          setSubmittedMessage("Thanks for your feedback, we really appreciate it!");
        } else {
          setSubmittedMessage("You have already shared your feedback for this session.");
        }
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "An unexpected error occurred.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setErrorMessage("Network error. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={` w-dvw bg-[#213C51] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out opacity-100 pointer-events-auto`}
      >
          <div className="bg-linear-to-b from-[#210C70]/0 to-[#0c4870] to-45% w-[100dvw] min-h-[110dvh] p-6 pt-20 animate-fade-in -mt-10">
            {isSubmitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <h2 className="font-['Bebas_Neue'] text-4xl tracking-widest text-white">{submittedTitle}</h2>
                <p className="font-['Zain'] font-medium text-white">{submittedMessage}</p>
              </div>
            ) : (
              <div className="font-['Zain']">
                <h2 className="font-['Bebas_Neue'] text-3xl tracking-widest text-white text-center">How did we do?</h2>
                <p className="text-center font-medium text-white mt-1">Your voice is really important!</p>

                <div className="mt-5">
                  <h3 className="p-1 pb-0 font-medium text-white">Overall, how satisfied were you with this session?</h3>
                  <div className="flex justify-center gap-3 mt-1">
                    {STARS.map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          setRatingError("");
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        className={`text-4xl transition-transform hover:scale-110 cursor-pointer ${
                          star <= (hoverRating || rating) ? 'text-amber-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className={`text-red-500 text-sm mt-0.5 font-medium text-center transition-opacity duration-150 ${ratingError ? 'opacity-100' : 'opacity-0'}`}>
                    {ratingError || ' '}
                  </p>
                </div>

                {textQuestions.map((question) => (
                  <div key={question.label} className="mt-2">
                    <h3 className="p-1 pb-0 font-medium text-white">{question.label}</h3>
                    <div className='p-1.5 pb-[0px]'>
                      <input
                        type="text"
                        value={question.value}
                        onChange={(e) => question.setValue(e.target.value)}
                        maxLength={200}
                        className="text-xl w-full bg-transparent border-b-2 border-gray-500 px-2 py-1 outline-none transition-colors focus:border-white text-white"
                      />
                    </div>
                  </div>
                ))}

                {errorMessage && (
                  <p className="text-red-500 text-sm mt-3 ml-2 font-medium">{errorMessage}</p>
                )}

                <div className="mt-5">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-[100%] px-8 py-1.5 text-xl rounded-md font-bold transition duration-200 border-2 border-teal-500 ${
                      isSubmitting
                        ? 'bg-teal-500/20 text-gray-400 cursor-not-allowed'
                        : 'bg-teal-500/20 text-[#00ac9a] hover:bg-teal-500 hover:text-white active:bg-teal-500 active:text-white'
                    }`}
                  >
                    {isSubmitting ? 'Wait...' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </>
  );
}
