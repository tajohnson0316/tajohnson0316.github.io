/* 
POPULATE FILTERED SPELL LIST
1. wait for user to change filter
2. call function to collect value and request API
3. parse through API according to filter options
4. populate Filtered Spells drop-down with matching options
 */
const completeSpellList = [];
collectAllSpellsFromAPI();

let classFilter = document.querySelector("#class-filter").value;
let previousClassFilter = "";

let levelFilter = document.querySelector("#level-filter").value;
let previousLevelFilter = "";

let filteredSpellList = document.querySelector("#spell-list");

let spellbook = document.querySelector("#spellbook");
let collectedSpells = [];

let spellRemoved = false;

function getClassFilter(element) {
  classFilter = element.value;
}

function getLevelFilter(element) {
  levelFilter = element.value;
}

function onClassFilterChange(element) {
  previousClassFilter = element.oldValue;
}

function onLevelFilterChange(element) {
  previousLevelFilter = element.oldValue;
}

function resetPreviousFilterValues() {
  previousClassFilter = classFilter;
  previousLevelFilter = levelFilter;
}

function checkFilterChange() {
  return (
    previousClassFilter != classFilter || previousLevelFilter != levelFilter
  );
}

function clearList() {
  filteredSpellList.innerHTML = (`
    <option selected value="default">
      Spell List
    </option>`
  );
}

function addCardToSpellbook(spellbookElement) {
  let spellName = spellbookElement.value;

  // don't try to add the "Spell List" option
  if (spellName != "default") {
    let newSpell = completeSpellList.find((spell) => spell.name == spellName);
    let newSpellIndex = completeSpellList.indexOf(newSpell);
    collectedSpells.push(spellName);

    let ritual = "";
    if (newSpell.ritual == "yes") {
      ritual = " (Ritual)";
    }

    let concentration = "";
    if (newSpell.concentration == "yes") {
      concentration = " (Concentration)";
    }

    let material = "";
    if (newSpell.material.length > 0) {
      material = ` (${newSpell.material})`;
    }

    let higherLevel = "";
    if (newSpell.higher_level.length > 0) {
      higherLevel = `
        <p>
          <scan class="fw-bold">At higher levels:</scan> ${newSpell.higher_level}
        </p>`;
    }

    spellbook.innerHTML += `
      <div 
        class="card flex-fill" 
        id="${newSpell.slug}" 
        value="${newSpell.name}">
        <div class="card-header d-flex justify-content-between fs-6 position-relative">
          <a
            href="https://open5e.com/spells/${newSpell.slug}"
            target="_blank"
            rel="noopener noreferrer"
            class="text-danger"
            >${newSpell.name}</a
          >
          <span>
            ${newSpell.level} ${newSpell.school} | ${newSpell.dnd_class}
          </span>
          <button 
            type="button" 
            class="btn btn-outline-secondary btn-md btn-exit position-absolute top-0 start-100 translate-middle"
            onclick="removeSpell('#${newSpell.slug}')"
          >
          <i class="bi bi-x-circle text-danger"></i>
          </button>
        </div>
        <div class="card-body">
          <p><scan class="fw-bold">Range:</scan> ${newSpell.range}</p>
          <p>
            <scan class="fw-bold">Casting Time:</scan> ${
              newSpell.casting_time + ritual
            }
          </p>
          <p>
            <scan class="fw-bold">Duration:</scan> ${
              newSpell.duration + concentration
            }
          </p>
          <p class="fw-bold">
            Components: ${newSpell.components} ${material}
          </p>
          <p>${newSpell.desc}</p>
          ${higherLevel}
        </div>
      </div>
      `;

    document.querySelector("#option-index-" + newSpellIndex).remove();
  }
}

function removeSpell(elementID) {
  let spellName = document.querySelector(elementID).value;
  let spellIndex = collectedSpells.indexOf(spellName);

  collectedSpells.splice(spellIndex, 1);
  document.querySelector(elementID).remove();
  spellRemoved = true;
}

function populateFilter() {
  if (!checkFilterChange() && !spellRemoved) {
    return;
  }

  resetPreviousFilterValues();
  clearList();
  spellRemoved = false;

  let hasClassFilter = !(classFilter == "default");
  let hasLevelFilter = !(levelFilter == "default");
  let bothFiltersDefault = !hasClassFilter && !hasLevelFilter;

  for (let i = 0; i < completeSpellList.length; i++) {
    let result = completeSpellList[i];

    if (bothFiltersDefault) {
      filteredSpellList.innerHTML += `<option id="option-index-${i}" value="${result.name}">${result.name}</option>`;
    } else if (collectedSpells.includes(result.name)) {
      continue;
    } else {
      let resultClassesArray = result.dnd_class.split(", ");
      if (hasClassFilter) {
        for (let j = 0; j < resultClassesArray.length; j++) {
          if (
            classFilter == resultClassesArray[j] &&
            (!hasLevelFilter || levelFilter == result.level_int)
          ) {
            filteredSpellList.innerHTML += `<option id="option-index-${i}" value="${result.name}">${result.name}</option>`;
          }
        }
      } else if (hasLevelFilter) {
        if (levelFilter == result.level_int) {
          filteredSpellList.innerHTML += `<option id="option-index-${i}" value="${result.name}">${result.name}</option>`;
        }
      }
    }
  }
}

// request url: https://api.open5e.com/spells/
async function requestAPI() {
  const data = await fetch("https://api.open5e.com/spells/").then(
    (response) => response.json()
  );
  return data;
}

async function collectAllSpellsFromAPI() {
  let data = await requestAPI();

  for (var a = data.results.length; a <= data.count; a += data.results.length) {
    data.results.forEach((result) => completeSpellList.push(result));

    if (a != data.count) {
      data = await fetch(data.next).then((response) => response.json());
    }
  }
}
