1: page.tsx: {route.key === "explore"
                    ? "Explore Games"
                    : route.key === "squads"
                    ? "Clubs & Squads"
                    : route.key === "chats"
                    ? "Messages"
                    : "Sports Passport"}: Do not hard code like this, use something else

2: page.tsx: use language for footer, right now change language doesnt change the footer content

3: move footer to an independant component
