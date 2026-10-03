/**
 * Article bodies in English, as Markdown; the seed converts them to the editor's format. A line
 * `{{figure:render:<name>}}` or `{{figure:scheme:<name>}}` places a picture in the text.
 */
export const ARTICLES_EN: Readonly<Record<string, string>> = {
  'frame-technology': `In a frame house the load is not carried by the wall as a whole but by a skeleton of timber: studs, plates, floor joists and rafters. The insulation, membranes and linings keep the heat in and the moisture out, but carry no load. That is why the wall is thin and warm at the same time: at 241 mm its thermal resistance is 3.61 m²·°C/W. A log wall needs about 60 cm to do the same.

## Kiln-dried timber

The frame is built from softwood dried in a kiln to 12–15 % moisture. Dry timber hardly warps and does not shrink, so the house can be finished straight after assembly instead of waiting a year, as a log house must. Studs are 50×150 mm, or 50×200 mm for thicker insulation.

Studs stand 600 mm apart — the width of a mineral wool slab — so the insulation is pressed in between them without gaps or trimming. Around windows and doors the studs are doubled and the opening is bridged by a header: the roof load goes around the window into the studs on either side. For panoramic glazing the header is calculated separately, because its span is longer.

## A wall in seven layers

From the inside out:

1. Interior lining: 14 mm softwood boards or plasterboard for painting.
2. A 25 mm service void for cables and pipes.
3. Vapour barrier: keeps moisture from the rooms out of the insulation.
4. Frame with mineral wool: 150 or 200 mm.
5. Wind barrier membrane: keeps the wind out but lets vapour through.
6. A 30 mm ventilated gap on counter-battens: carries the moisture away.
7. Cladding: timber imitation boards, planken or fibre-cement panels.

The order is not arbitrary: each layer towards the outside lets vapour through more easily than the one inside it. The wall dries outwards and never collects moisture, and cables in the service void never pierce the vapour barrier.

## Floors, ceilings and the roof

The house stands on screw piles. A glulam ring beam goes on the pile caps, and the floor joists with 200 mm of insulation go on the beam. The finished floor is 600 mm above the ground: the space under the house is ventilated and snow does not reach the walls.

{{figure:scheme:pile-foundation}}

The ground-floor ceiling gets 200 mm of insulation, and an attic floor gets 200 mm in its slopes. Heat escapes upwards more than through the walls, so the top of the house is never skimped on. The roof is standing-seam steel over an underlay: the sheets lock together at the seams, with no screws through the metal, so there is nothing to leak.

## What the workshop does

The frame is not cut on site. In the workshop the timber is cut to the working drawings, wall panels are assembled, insulation and membranes are laid, windows are fitted and every part is marked. What arrives on the plot is a kit assembled by numbers: the house is weathertight within the first week, and the whole assembly takes one to two weeks.

The workshop is also where quality is checked. Panel geometry and joints are checked against a checklist before dispatch, on a flat table under a roof rather than in the wind and rain.

## Frame, timber or aerated concrete

Logs and beams are both the structure and the insulation, but wood conducts heat better than wool, so the wall ends up thick, and a log house keeps settling for six months to a year before windows and finishes can go in. Aerated concrete needs a strip foundation or a slab, wet trades and a season for the masonry to dry, and for a winter house it still has to be insulated.

A frame house is light, so screw piles are enough. There are no wet trades and no settling, and the heat is kept in by a layer designed for exactly that. Hence the timeline: three to five months from contract to a turnkey house, most of it in the workshop.

## Fire, sound and service life

Mineral wool neither burns nor melts, and the timber is treated with a fire and rot protection. The same wool absorbs sound: a partition with insulation is noticeably quieter than a hollow one.

What decides how long a frame lasts is moisture. As long as the vapour barrier is intact and the ventilated gap is open at the bottom and the top, the timber has nothing to suffer from, and the house serves for decades — this is how they build in Scandinavia and Canada.

The Technology section shows the wall in section, and the insulation thickness and stud size are chosen in the configurator with a single switch.`,

  'insulation-150-or-200': `In the configurator the insulation thickness is a single switch: 150 or 200 mm. Behind it are a different frame section, different estimate lines and different heat loss. Here is what actually changes, and who needs the thicker option.

## What changes in the wall

The insulation sits between the studs, so the frame grows with it: 50×200 mm instead of 50×150 mm. The other layers stay as they are: lining, service void, vapour barrier, wind barrier, ventilated gap and cladding. The wall becomes 50 mm thicker: 291 mm instead of 241 mm.

{{figure:scheme:insulation-compare}}

The thermal resistance of the wall rises from 3.61 to 4.72 m²·°C/W, by almost a third. Every square metre of wall loses 23 % less heat.

## What it means in kilowatt-hours

The thermal protection standard for the walls of a house in St Petersburg and the Leningrad region is about 3.0 m²·°C/W (SP 50.13330). Both walls meet it: 150 mm with about 20 % to spare, 200 mm by more than half again.

How much heat this saves depends on the wall area. For a single-storey house like “Pines”, with about 100 m² of walls without windows, 200 mm saves around 700 kWh per heating season. That shows on the heating bill but does not transform it: more heat leaves through the windows, floor, ceiling and ventilation than through the walls.

## What it means in the estimate

The extra cost comes from two lines: a 50×200 wall frame instead of 50×150, and 200 mm of insulation instead of 150. At the 2026 tariff this is about 1,150 rubles per square metre of wall, so for the same “Pines” it is over a hundred thousand rubles. The configurator shows the exact difference for any project right next to the option, before you choose.

Counting only the heating savings, the extra cost pays back slowly. So the decision is made not by a payback table but by how the house will be lived in.

## When to choose 200 mm

- A house to live in all year: the heating runs for half the year, and the reserve is felt every day.
- Heating by electricity or bottled gas, where every kilowatt-hour is expensive.
- Large windows and an open plan: a thicker wall takes some of the load off the heating in hard frosts.
- An attic floor or a second storey: there is more wall, and the difference in kilowatt-hours grows with it.

## When 150 mm is enough

- A summer house or a guest house used in summer and at weekends.
- A sauna: the stove heats it, and the steam room is insulated by its own rules, with foil and a gap behind the lining.
- A small house with little wall area, where the budget matters more than the reserve.

## Why not 250 mm

Each further 50 mm of wool gives less than the last. Going from 150 to 200 mm removes 23 % of the heat loss through the walls; from 200 to 250 mm only 19 %, while the wall gets thicker still and needs an even deeper frame. And the walls are only part of a house's heat loss: windows and ventilation take a large share. So beyond 200 mm it pays to invest in supply and exhaust ventilation with heat recovery, which returns the heat of the outgoing air — it is among the building services in the configurator.

## What matters more than thickness

Insulation works as long as it is dry and fits without gaps. A vapour barrier with taped seams, a ventilated gap open at the bottom and the top, and slabs pressed in tight do more than an extra 50 mm of wool with cold bridges. That is why both options are assembled in the workshop, where every joint is checked before a panel leaves.

The floor and the ceiling get the same insulation whatever you choose: 200 mm. Heat escapes upwards more than through the walls, and that is no place to save.`,

  'screw-piles': `Most of our houses stand on screw piles. It is not about saving for its own sake: such a foundation goes in within a day, does not mind frost heave and does not need to wait for concrete to cure.

## How it works

A pile is a steel tube 108 mm in diameter with a helical blade at the bottom. It is screwed in below the frost line, usually 2.5 m deep. The blade bears on firm soil and the pile holds its load like an anchor. The piles of a house work together: the glulam ring beam spreads the load, so even if the soil under one pile is weaker, the house stays level.

Piles are set out on a grid about 2 m apart, under the walls, partitions and the terrace. A ring beam goes on the pile caps and floor joists on the beam. The finished ground floor ends up 600 mm above ground: the space under the house is ventilated and snow does not reach the walls.

## How the piles go in

First the pile field is set out from the scheme in the working drawings. The piles are screwed in by machine and checked with a level so that each stands plumb. Then they are cut to one plane with a surveying level, filled with concrete so that the steel does not rust from inside, and the caps are welded on. A house from the catalogue takes one or two days, after which the ring beam can go on straight away.

## When piles do not fit

- rock or large boulders — a pile cannot be screwed in;
- a project with a basement or a built-in garage;
- a plot that needs a slab for underfloor heating on the ground.

Before the works we do a test screw-in on the plot: the torque shows where the bearing soil begins, and the pile length is chosen from the facts.

## What the estimate includes

The number of piles is calculated from the house plan automatically, on the same grid as in the drawing. The terrace and the porch stand on piles of their own, and they are counted too. Piles with caps and the glulam ring beam are the first lines of the estimate, in the Foundation section.`,

  'choosing-a-roof': `The roof defines more than the silhouette of a house. Its shape decides whether there is an upper floor, what the house costs and how it copes with snow.

## Gable

The most reliable and familiar shape: snow slides off by itself, and there is room for an attic floor or a cold loft. Pitch 25–45°. If the project has an attic floor, a gable roof is the natural choice. The eaves keep rain off the walls, and the gables make room for attic windows.

## Shed

A contemporary silhouette and a tall wall for panoramic windows. The pitch is shallow, 10–20°, so there is no attic floor under it. It suits guest houses and saunas where everything is on one level. The tall wall is turned towards the best view or the sun, the low one towards the neighbours and the road.

## Gambrel

An attic roof with a break in each slope: with the same wall height there is almost a full floor upstairs. The attic is larger than under a gable roof, but the roof is more complex, so the rafters cost more.

## Snow and water

Our roofs are standing seam: steel sheets locked together at the seams, laid over an underlay. Snow does not hold on smooth steel, so the steeper the pitch, the sooner a slope clears itself. A shed roof is shallow and snow stays on it longer, which the rafters are designed for. Gutters and downpipes are included in the estimate along the perimeter for every roof shape, and snow guards above the entrance and the path are fitted on site.

## How to choose

1. You need an upper level — gable or gambrel.
2. Panoramic windows and a simple volume matter — shed.
3. Plenty of snow and forest around — a steeper pitch, so snow slides off sooner.
4. You want an attic with nearly upright walls and the most floor area — gambrel, if the budget allows more complex rafters.

In the configurator you can switch the roof on the fly: the model rebuilds and the estimate shows the price difference. If a roof does not suit the project — say, a shed roof over an attic floor — the configurator explains why.`,

  'sauna-frame': `A frame sauna heats up faster than a log one and does not settle, so you can use it the first weekend after handover. But a steam room asks more of its walls. A sauna needs no foundation of its own: it stands on the same screw piles as a house.

## Foil, not film

Humidity and temperature in a steam room are higher than in a house. Instead of the usual film we fit a foil vapour barrier with taped joints: it reflects heat back into the room and lets no vapour through. The foil goes shiny side in, and the joints are sealed with aluminium tape: through any tear the vapour would reach the insulation.

## A gap behind the lining

Between the foil and the lining boards there are 20–25 mm battens. The gap ventilates the lining so it dries after every session.

## Steam room size

For two or three people a steam room of 4–6 m² is enough. The ceiling stays at 2.1–2.2 m: any higher and the steam rises out of reach and the room takes longer to heat. Benches are on two levels, the top one about a metre below the ceiling, so you sit in the hottest layer of air. The lining is lime or aspen: it heats up less and releases no resin. The window is small: a large pane loses heat, and the view is better left to the rest room.

## Stove and flue

The stove is sized to the volume of the steam room, with a margin for a window and a glazed door. The flue runs through an insulated twin-wall pipe and a ceiling pass-through. Clearances to timber follow the stove's data sheet. The flue is shown on the 3D model and included in the estimate.

## Washroom and floors

The washroom floor falls to a drain on a moisture-proof base. Steam room floors are not sealed all the way: there must be ventilation underneath. The washroom and the rest room are insulated like an ordinary house.

> A good sauna is ventilation first: fresh air in by the stove, exhaust in the opposite corner.

Our sauna projects are “Alder” and “Birch”: open them in the catalogue and in the configurator.`,

  'estimate-explained': `The price of a house on the site is not “from-to depending on”, but an itemised estimate. It is calculated by the same parametric model that draws the 3D view, so the estimate and the picture always agree: change the roof, and both the view and the total change.

## Quantities: what the model measures itself

The model knows the geometry of the house to the millimetre and takes off quantities the way an estimator takes them off a drawing:

- the area of the exterior walls and the facade;
- the area of the floor, ceiling, intermediate floors and roof;
- the area of slope insulation, if there is an attic floor;
- the perimeter, for the ring beam and the gutters;
- the window area, with panoramic glazing counted separately, and the number of entrance and interior doors;
- the number of piles, on the same grid as in the foundation drawing;
- the area of the terrace and porch, and the number of entrance steps;
- the number of wet rooms and flues.

Nothing is entered by hand: areas are measured from the same dimensions as the project's floor plans.

## Rates: what the factory maintains

Every estimate line is a quantity times a rate: rubles per square metre of wall, per pile, per running metre of perimeter. For example, the line “Wall frame 50×150” is the wall area from the model multiplied by the rate per square metre. The rates make up a tariff that the factory maintains in the CMS. When a material gets more expensive, one rate is changed, and the new prices appear in every project at once.

Options switch rates rather than add a guessed mark-up. Fibre-cement cladding changes the facade rate, 200 mm insulation changes the frame and insulation rates, a gambrel roof changes the rafter rate. That is why the difference between options is shown in rubles next to each of them.

Kit delivery with a site cabin is a fixed sum within the region, while supervision and site cleaning are calculated from the total area of the house.

## Packages

The lines are grouped into sections: foundation, kit and frame, insulation and membranes, roofing, windows and doors, facade, terrace, delivery, building services and interior finishing. A package is a set of sections:

- **Weathertight shell** — the house closed from outside: foundation, frame, insulation, roof, windows, doors, facade, terrace and delivery.
- **Ready for finishing** — plus building services: wiring, water and drainage, heating, ventilation, and the stove if the project has one.
- **Turnkey** — plus finishing of walls, floors and ceilings, and interior doors.

The “from” price in the catalogue is the weathertight shell without options, rounded up to a thousand rubles. The estimate itself stays exact to the ruble.

## The schedule comes from the same quantities

Alongside the estimate the model calculates a schedule. Each stage has a base duration plus an increment for its quantity: frame assembly depends on the floor area, roofing on the roof area, windows on their number. The stages depend on each other: roofing starts after the frame, finishing after the services. Kit production and the pile field run in parallel, so the whole schedule is shorter than the sum of its stages. Working days are counted, five a week: “Pines” turnkey, for example, takes 19 weeks from contract to handover.

## What the estimate does not include

- Site preparation: clearing, tree felling, access for machinery.
- Utility connections: electricity from the supplier, a well, a septic tank.
- Delivery beyond 250 km from the factory, which is calculated separately.

## The estimate is fixed

A saved configuration keeps the estimate and the schedule as they were calculated. The link and the PDF proposal show the same figures a month later, even if the tariff has changed. New prices appear only if you open the configuration in the configurator and save it again.`,

  'choosing-a-project': `Choosing a project is easier if you start not from a picture but from how you will live in the house: how many people, how often, all year round or only in summer. The answers narrow the catalogue down to two or three options, which are then easy to compare in the configurator.

## How much floor area you need

A rule of thumb for a house to live in all year is 30–40 m² per person: 100–140 m² for a family of three or four. A summer house needs 50–80 m², a guest house 25–40 m².

It is more useful to count rooms than square metres:

- a bedroom for each couple and each child, preferably from 9–10 m²;
- a kitchen and living room, the main room of the house, preferably from 25 m²;
- a bathroom on each floor, and a second one with three bedrooms;
- a store or plant room: the building services need space too.

A guest house or a sauna on the same plot takes some of the load off the main house: guests will not need a bedroom of their own in it.

In the catalogue, floor area, storeys, bedrooms and budget are filters, so whatever does not fit is gone in a minute. On the project page the floor plan is drawn to scale, with the dimensions of every room.

## One storey or an attic floor

A single-storey house is easier to live in: no stairs, every room close by — valuable with small children and in later years alike. But it needs more space on the plot, and there is more foundation and roof per square metre of house.

{{figure:render:sosny-aerial}}

An attic floor gives a second level for little more than the cost of the roof: bedrooms upstairs, living room downstairs. The stairs take 4–5 m² on each floor, and the ceiling is lower under the slopes — a good place for wardrobes and beds, not for walking upright. A gambrel roof raises the slopes and makes the attic almost a full storey.

{{figure:render:pikhta-m-front}}

## The plot and the points of the compass

- The house must stand at least 3 m from the plot boundary, so a narrow plot suggests an elongated project.
- The terrace and the living room windows are best facing south or west, for sun in the afternoon and evening.
- The entrance is handiest on the side of the drive. If you need it on the other side, the configurator can mirror the plan.
- A sauna is best as a separate building: “Alder” and “Birch” have their own stove, steam room and terrace.

## Package and budget

The “from” price in the catalogue is the weathertight shell: the house closed from outside, without services or finishing. If you want to move in straight away, look at the Turnkey package; the project page shows all three packages side by side, with their totals and schedules.

In the configurator the price of every option is shown next to it: panoramic windows, cladding, insulation, terrace. Decisions are made in rubles, not by eye. If the budget is tight, start from a smaller size of the same series: the layout stays, the total goes down. Size is the first step of the configurator.

## How to compare options

Save each configuration: it gets a short link that always opens it just as you left it, with the price on the day you saved it. The links are easy to send to the family and compare in the evening, and for a talk with the bank you can download the PDF proposal with a render, an itemised estimate and a schedule. Options of the same project are the easiest to compare: you see what each decision costs on its own.

Once you have chosen, send a request straight from the configurator. The manager receives it with the configuration and the estimate, and the conversation starts from your house rather than from “what were you looking for?”.`,

  'how-we-build': `From the first request to the keys takes three to five months, depending on the project and the package. Most of the work happens in the workshop, so on site the house goes up quickly and in dry weather.

## 1. Project and estimate

You configure the house online or visit us. A manager checks the configuration, asks about the plot and prepares a contract with the estimate and schedule. The specifics of the plot — a slope, trees, awkward access — are taken into account in the working drawings.

## 2. Production

In the workshop, kiln-dried timber is cut on machines, wall panels and roof elements are assembled, windows are fitted. Every part is marked to the drawing.

## 3. Foundation

While production runs, screw piles and the ring beam go in on the plot. It takes a day or two, and before that a test pile is screwed in to choose the pile length for the soil.

## 4. Assembly

The kit is delivered and assembled in one or two weeks: panels, floors, roof, facade. The house is weathertight within the first week. The crew lives in a site cabin, so the work does not depend on the commute.

## 5. Services and finishing

With the Ready for finishing or Turnkey package come wiring, water, heating, ventilation and interior finishing.

## 6. Handover

We check the house against a checklist, show how the systems work and hand over the documents and keys. Every remark is put right before the acceptance certificate is signed.

## What we need from you

- A plot with access for a truck: the kit arrives on one or two vehicles.
- A decision on utilities: where electricity and water will come from and where the septic tank will go. Utility connections are not part of the house estimate.
- A clear area next to the house footprint where the kit can be stored during assembly.
- One person to stay in touch, accept the stages and settle questions on site.

The configurator calculates the exact schedule for your configuration at once, from the same quantities as the estimate.`,
}
