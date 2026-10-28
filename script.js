
let currentCategory = "all";

document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("searchBar");
    const resetButton = document.getElementById("resetFilters");

    // Category buttons.
    document.querySelectorAll(".filter-buttons button").forEach(button => {
        button.addEventListener("click", () => {
            currentCategory = button.dataset.category || "all";

            document.querySelectorAll(".filter-buttons button").forEach(item => {
                item.classList.toggle("active", item === button);
            });

            filterAll();
        });
    });

    // Search as the user types.
    searchBar?.addEventListener("input", filterAll);

    // Sidebar checkboxes and age selector.
    document.querySelectorAll(
        '.filter-sidebar input[type="checkbox"], #ageSelect'
    ).forEach(input => {
        input.addEventListener("change", filterAll);
    });

    // Reset all filters.
    resetButton?.addEventListener("click", resetFilters);

    // Make card tags clickable.
    document.querySelectorAll(".card .tag, .card .detail-tag").forEach(tag => {
        tag.title = "Click to filter opportunities";

        tag.addEventListener("click", () => {
            applyPillFilter(tag);
        });
    });

    filterAll();
});

// Normalize text for comparisons.
function normalize(value) {
    return (value || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// Read comma-separated values from a card's data attributes.
function getCardValues(card, attribute) {
    return (card.dataset[attribute] || "")
        .split(",")
        .map(value => normalize(value))
        .filter(Boolean);
}

// Get selected values for one filter group.
function getSelectedValues(filterName) {
    return Array.from(
        document.querySelectorAll(
            `.filter-sidebar input[data-filter="${filterName}"]:checked`
        )
    ).map(input => normalize(input.value));
}

// Check whether a card matches a filter group.
// Multiple choices in one group use OR logic.
function matchesGroup(card, filterName, attribute) {
    const selected = getSelectedValues(filterName);

    if (selected.length === 0) {
        return true;
    }

    const cardValues = getCardValues(card, attribute);

    // Cards without eligibility information cannot match an active filter.
    if (cardValues.length === 0) {
        return false;
    }

    return selected.some(value => {
        if (filterName === "grades" && value === "all grades") {
            return cardValues.includes("all grades");
        }

        if (filterName === "grades") {
            return cardValues.includes(value) ||
                cardValues.includes("all grades");
        }

        if (filterName === "cost" && value === "costs associated") {
            return cardValues.some(item =>
                item === "costs associated" ||
                item === "paid" ||
                item === "fee"
            );
        }

        return cardValues.includes(value);
    });
}

// Match the selected age against each card's eligibility metadata.
function matchesAge(card) {
    const ageSelect = document.getElementById("ageSelect");
    const selectedAge = ageSelect?.value || "";

    if (!selectedAge) {
        return true;
    }

    const ages = getCardValues(card, "ages");

    if (ages.length === 0) {
        return false;
    }

    return ages.includes("all ages") || ages.includes(selectedAge);
}

// Filter every card using all active criteria.
function filterAll() {
    const cards = document.querySelectorAll(".card");
    const searchText = normalize(
        document.getElementById("searchBar")?.value
    );

    cards.forEach(card => {
        const cardText = normalize(card.textContent);

        const matchesCategory =
            currentCategory === "all" ||
            normalize(card.dataset.category) === normalize(currentCategory);

        const matchesSearch = cardText.includes(searchText);

        const matchesTime = matchesGroup(card, "time", "time");
        const matchesSeason = matchesGroup(card, "season", "season");
        const matchesCost = matchesGroup(card, "cost", "cost");
        const matchesLocation = matchesGroup(card, "location", "location");
        const matchesStatus = matchesGroup(card, "status", "status");
        const matchesGender = matchesGroup(card, "gender", "gender");
        const matchesGrade = matchesGroup(card, "grades", "grades");
        const matchesSelectedAge = matchesAge(card);

        const isVisible =
            matchesCategory &&
            matchesSearch &&
            matchesTime &&
            matchesSeason &&
            matchesCost &&
            matchesLocation &&
            matchesStatus &&
            matchesGender &&
            matchesGrade &&
            matchesSelectedAge;

        card.hidden = !isVisible;
    });
}

// Clicking a pill on a card applies the corresponding filter.
function applyPillFilter(pill) {
    const label = normalize(pill.textContent);

    const categoryTag = pill.classList.contains("tag");

    const categoryMap = {
        "program": "Program",
        "scholarship": "Scholarship",
        "internship": "Internship",
        "competition": "Competition",
        "volunteer": "Volunteer",
        "research": "Research",
        "hackathon": "Hackathon"
    };

    // Clicking a category tag selects its category.
    if (categoryTag && categoryMap[label]) {
        resetFilters();
        currentCategory = categoryMap[label];

        document.querySelectorAll(".filter-buttons button").forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.category === currentCategory
            );
        });

        filterAll();
        return;
    }

    const filterMap = {
        "free": ["cost", "Free"],
        "paid": ["cost", "Paid"],
        "costs associated": ["cost", "Costs Associated"],
        "open": ["status", "Open"],
        "closed": ["status", "Closed"],
        "ends soon": ["status", "Ends Soon"],
        "spring": ["season", "Spring"],
        "summer": ["season", "Summer"],
        "fall": ["season", "Fall"],
        "winter": ["season", "Winter"],
        "school year": ["time", "School Year"],
        "in-person": ["location", "In-Person"],
        "virtual": ["location", "Virtual"],
        "remote / virtual": ["location", "Virtual"],
        "9th grade": ["grades", "9th Grade"],
        "10th grade": ["grades", "10th Grade"],
        "11th grade": ["grades", "11th Grade"],
        "12th grade": ["grades", "12th Grade"],
        "all grades": ["grades", "All Grades"],
        "female-identifying students": ["gender", "Female-Identifying Students"],
        "male-identifying students": ["gender", "Male-Identifying Students"]
    };

    // Clear previous filters before applying the clicked pill.
    resetFilters();

    // The age-range tag represents the listed teen age range.
    if (label === "13–18" || label === "13-18") {
        document.getElementById("ageSelect").value = "13";

        // Show cards that accept at least one age from 13 through 18.
        document.querySelectorAll(".card").forEach(card => {
            const ages = getCardValues(card, "ages");
            card.dataset.pillAgeRange = String(
                ages.includes("all ages") ||
                ages.some(age => {
                    const number = Number(age);
                    return Number.isInteger(number) && number >= 13 && number <= 18;
                })
            );
        });

        filterAll();
        return;
    }

    if (label === "all ages") {
        document.getElementById("ageSelect").value = "";
        filterAll();
        return;
    }

    const filter = filterMap[label];

    if (!filter) {
        filterAll();
        return;
    }

    const [filterName, filterValue] = filter;

    const matchingCheckbox = Array.from(
        document.querySelectorAll(
            `.filter-sidebar input[data-filter="${filterName}"]`
        )
    ).find(input => normalize(input.value) === normalize(filterValue));

    if (matchingCheckbox) {
        matchingCheckbox.checked = true;
    }

    filterAll();
}

// Reset search, category, age, and checkboxes.
function resetFilters() {
    document.getElementById("searchBar").value = "";
    document.getElementById("ageSelect").value = "";

    document.querySelectorAll(
        '.filter-sidebar input[type="checkbox"]'
    ).forEach(input => {
        input.checked = false;
    });

    document.querySelectorAll(".card").forEach(card => {
        delete card.dataset.pillAgeRange;
    });

    currentCategory = "all";

    document.querySelectorAll(".filter-buttons button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === "all"
        );
    });

    filterAll();
}

/* ================================
   SUGGEST AN OPPORTUNITY
================================ */

const suggestDialog = document.getElementById("suggestOpportunityDialog");
const suggestBtn = document.getElementById("suggestOpportunityBtn");
const closeSuggestBtn = document.getElementById("closeSuggestDialog");
const cancelSuggestBtn = document.getElementById("cancelSuggestBtn");
const suggestForm = document.getElementById("suggestOpportunityForm");
const suggestStatus = document.getElementById("suggestFormStatus");
const suggestSubmitBtn = suggestForm.querySelector(
    'button[type="submit"]'
);

// Replace this with your Formspree form endpoint.
const suggestionEndpoint = "https://bridge-okke.onrender.com/api/suggestions";

// Open the form.
suggestBtn.addEventListener("click", () => {
    suggestStatus.textContent = "";
    suggestDialog.showModal();
});

// Close the form.
function closeSuggestionDialog() {
    suggestDialog.close();
}

closeSuggestBtn.addEventListener("click", closeSuggestionDialog);
cancelSuggestBtn.addEventListener("click", closeSuggestionDialog);

// Close when clicking the backdrop.
suggestDialog.addEventListener("click", (event) => {
    if (event.target === suggestDialog) {
        closeSuggestionDialog();
    }
});

// Submit the suggestion for review.
suggestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!suggestForm.reportValidity()) {
        return;
    }

    if (suggestEndpointIsNotConfigured()) {
        suggestStatus.textContent =
            "The submission service has not been connected yet. Please configure the form endpoint first.";
        return;
    }

    suggestSubmitBtn.disabled = true;
    suggestSubmitBtn.textContent = "Submitting...";
    suggestStatus.textContent = "";

    try {
        const response = await fetch(suggestionEndpoint, {
            method: "POST",
            body: new FormData(suggestForm),
            headers: {
                Accept: "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Submission failed");
        }

        suggestForm.reset();

        suggestStatus.textContent =
            "Thank you! Your suggestion has been submitted for review.";

        suggestForm.querySelectorAll("input, select, textarea, button")
            .forEach((field) => {
                field.disabled = true;
            });

        suggestSubmitBtn.textContent = "Submitted ✓";

        // Let the student read the confirmation before closing.
        window.setTimeout(() => {
            suggestDialog.close();

            suggestForm.querySelectorAll(
                "input, select, textarea, button"
            ).forEach((field) => {
                field.disabled = false;
            });

            suggestSubmitBtn.textContent = "Submit for Review →";
            suggestStatus.textContent = "";
        }, 2200);

    } catch (error) {
        suggestStatus.textContent =
            "We couldn't submit your suggestion. Please try again.";

        suggestSubmitBtn.disabled = false;
        suggestSubmitBtn.textContent = "Submit for Review →";
    }
});

function suggestEndpointIsNotConfigured() {
    return suggestionEndpoint.includes("YOUR_FORM_ID");
}

function makePills(values, cssClass) {
    return (values || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
        .map(value => '<span class="detail-tag ' + cssClass + '">' + value + "</span>")
        .join("");
}

function makeTagRow(pills) {
    return pills ? '<div class="tag-row">' + pills + "</div>" : "";
}

function loadApprovedOpportunities() {
    const grid = document.getElementById("cardGrid");

    if (!grid) {
        return;
    }

    fetch("https://bridge-okke.onrender.com/api/opportunities")
        .then(response => response.json())
        .then(opportunities => {
            opportunities.forEach(opp => {
                const card = document.createElement("article");
                card.className = "card";

                card.dataset.category = opp.category || "";
                card.dataset.cost = opp.cost || "";
                card.dataset.location = opp.location || "";
                card.dataset.grades = opp.eligible_grades || "";
                card.dataset.ages = opp.eligible_ages || "";
                card.dataset.season = opp.season || "";
                card.dataset.time = opp.time_of_year || "";

                const seasonTimePills =
                    makePills(opp.season, "season-tag") +
                    makePills(opp.time_of_year, "school-year-tag");
                const gradePills = makePills(opp.eligible_grades, "grade-tag");
                const agePills = makePills(opp.eligible_ages, "age-tag");

                let genderPills = "";
                if (opp.gender && opp.gender !== "Both") {
                    genderPills = makePills(opp.gender, "");
                    card.dataset.gender = opp.gender;
                }

                card.innerHTML =
                    '<div class="card-top-tags">' +
                        '<span class="tag">' + opp.category + "</span>" +
                        (opp.cost ? '<span class="detail-tag free-tag">' + opp.cost + "</span>" : "") +
                    "</div>" +
                    (opp.image
                        ? '<img src="' + opp.image + '" alt="' + opp.opportunity_name + ' logo">'
                        : "") +
                    "<h3>" + opp.opportunity_name + "</h3>" +
                    '<div class="opportunity-details">' +
                        '<div class="location-info">' +
                            '<svg class="location-pin" viewBox="0 0 24 24" fill="none" ' +
                                'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" ' +
                                'stroke-linejoin="round" aria-hidden="true">' +
                                '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>' +
                                '<circle cx="12" cy="10" r="2.5"/>' +
                            "</svg>" +
                            "<span>" + (opp.location || "") + "</span>" +
                        "</div>" +
                        '<div class="opportunity-tags">' +
                            makeTagRow(seasonTimePills) +
                            makeTagRow(gradePills) +
                            makeTagRow(agePills) +
                            makeTagRow(genderPills) +
                        "</div>" +
                    "</div>" +
                    '<a href="' + opp.official_website + '" target="_blank" ' +
                        'rel="noopener noreferrer" class="website-link">Website ↗</a>';

                card.querySelectorAll(".tag, .detail-tag").forEach(tag => {
                    tag.title = "Click to filter opportunities";
                    tag.addEventListener("click", () => {
                        applyPillFilter(tag);
                    });
                });

                grid.appendChild(card);
            });

            filterAll();   // re-run filters so the new cards obey them
        });
}

document.addEventListener("DOMContentLoaded", loadApprovedOpportunities);
