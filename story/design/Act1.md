This is a side-view block diagram layout for "Act 1: The Underhive."

### Legend & Key

**Environment Structure**
`#` = Solid Industrial Walls/Floor (Impassable)
`=` = Standard Platform (Passable/Jumpable)
`|` = Thin vertical pole/ladder (Climbable)
`.` = Empty Space/Background

**Gameplay Elements**
`[RRR]` = **Red Zone** (Heat/Steam Vent - Hazard with timing cycles)
`<O>` = **Enforcer** (Patrol Drone - Moving enemy with detection radius)
`<--->` or `^ v` = Drone Patrol Path indicator
`[///]` = **Shadow Zone** (Safe hiding alcove - visually darker)

**Narrative & Objectives**
`[START]` = Player Starting Position
`[ † ]` = Dead Member of The Unmasked (Narrative Object)
`[MASK]` = The Grey Mask Pickup (Objective)
`[EXIT]` = Level Transition upwards

---

### Side-View Layout Diagram

```text
TOP OF SECTION

######################### [EXIT] #########################
#                                                        #
#    (Section E: Final Ascent - Stealth Application)     #
#                                                        #
#        [///]                                           #
#      #######    <O> -> -> -> -> -> ->                  #
#      #          <--------------------                  #
#      #                                      =======    #
#      #   [RRR]             [///]                       #
#      #   ######           #######                      #
#      #                                                 #
#      #                                      [RRR]      #
#      #             <O>                      #####      #
#      #              ^                                  #
#      #              | (Vertical Patrol)                #
#      #              v                                  #
#      #                                                 #
#      #   =======          (Entrance to Mask Room)      #
#      #                                   >>>           #
#############################################  ###########
#                                                        #
#    (Section D: Narrative Chamber - Sanctuary)          #
#                                                        #
#      [///] (Quiet, safe atmosphere)                    #
#                                                        #
#                  [ † ]  [MASK]                         #
#                                                        #
#      =================================                 #
##########################################################
#                                                        #
#    (Section C: The Grinder - Narrow & Hostile)         #
#                                                        #
#               |  |                                     #
#      [RRR]    |  |    [RRR]                            #
#      #####    |  |    #####                            #
#               |  |                                     #
#      [///]    |  |                                     #
#      =====    |  |    =====                            #
#               |  |                                     #
#               |  |    <O> <---> (Blocking main shaft)  #
#               |  |                                     #
#      =====    |  |    [///]                            #
#      [RRR]    |  |                                     #
#      #####    |  |                                     #
#                                                        #
##########################################################
#                                                        #
#    (Section B: Introduction of Threats)                #
#                                                        #
#            =======                                     #
#                                                        #
#      <O> <---------------------> (Wide Patrol)         #
#                                                        #
#      [///]         =======                             #
#      #####                                             #
#                                   [RRR] (Timed Jet)    #
#               =======             #####                #
#                                                        #
##########################################################
#                                                        #
#    (Section A: The Roots - Tutorial & Atmosphere)      #
#                                                        #
#                     ======= (First Upward Jump)        #
#                                                        #
#                                                        #
#      [START]     (Low Ceiling - Claustrophobic)        #
#      =========================                         #
##########################################################

BOTTOM OF SECTION

```

---

### Labeled Breakdown & Flow Explanation

**A. The Roots (Tutorial & Atmosphere)**

- **Flow:** The player spawns in a cramped, dark corridor with a very low ceiling to immediately establish claustrophobia. The only way forward is up.
- **Key Elements:** A simple jump onto a platform teaches basic vertical movement without threat.

**B. Introduction of Threats (Fear)**

- **Flow:** The space opens slightly into a wider shaft. The player encounters the first hazards.
- **Key Elements:**
- **Red Zone (Heat):** A steam vent on the right wall periodically blasts the easiest path upward, forcing the player to learn timing or take a slightly harder jump to the left.
- **Enforcer & Shadow Zone:** Above the steam, a drone patrols horizontally. Directly below its path, a clearly marked **Shadow Zone [///]** alcove is provided. This teaches the player the core loop: identify threat -> find hiding spot -> wait for opening -> proceed.

**C. The Grinder (Increasing Pressure)**

- **Flow:** The level constricts into a narrow central shaft with climbable pipes/ladders. The feeling of oppression is maximized here.
- **Key Elements:**
- **Verticality:** Rapid upward movement is required on the pipes.
- **Hazards:** Heat vents are placed on alternating sides of the shaft, forcing the player to jump back and forth across the central pipes while climbing.
- **Enforcer:** A drone blocks the top of this narrow shaft, forcing the player to bail out onto a side platform into a Shadow Zone before they get trapped in the narrow space with the enemy.

**D. Narrative Chamber (Relief & Shift)**

- **Flow:** Near the top third, a side path diverges into a dead-end room. The industrial noise is dampened here.
- **Key Elements:**
- **Sanctuary:** There are absolutely no hazards or enemies in this room. It is a forced pause.
- **The Beat:** The player finds the dead NPC `[ † ]` and the Grey Mask `[MASK]`. Picking up the mask signals a shift in gameplay possibilities (empowerment).

**E. Final Ascent (Stealth Application)**

- **Flow:** Leaving the sanctuary, the player must traverse the final, most dangerous section to reaching the exit grate.
- **Key Elements:**
- **Putting it together:** This section combines tight platforming, vertical and horizontal drone patrols, and heat vents.
- **Design Intent:** The patrol paths are set up so that running gun-ho is nearly impossible. The player _must_ utilize the provided Shadow Zones to time their movements past the drones, immediately reinforcing the theme of the mask they just acquired. The level ends at the `[EXIT]` grate above.
