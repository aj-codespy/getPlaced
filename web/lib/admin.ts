export const ADMIN_EMAILS = [
  "admin@getplaced.com",
  "test@example.com",
  "aj_builds@getplaced.com",
  "ajayush2301@gmail.com" // You can add your actual emails here
];

export const isAdmin = (email?: string | null) => {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  return ADMIN_EMAILS.includes(lowerEmail) || process.env.NEXT_PUBLIC_ADMIN_EMAIL === lowerEmail;
};
