# Spec Delta

## MODIFIED Requirements

### Requirement: Movement-Driven Time Scale Ramping
The simulation SHALL scale time dynamically between the baseline rate and 100% real-time speed proportional to the player's movement velocity, smoothly accelerating as keys are held and decelerating when released. Acceleration on movement input SHALL engage with immediate attack to preserve twitch dodging responsiveness, while deceleration upon key release SHALL follow an asymmetric smooth settling decay curve (~180–220ms wall-clock duration) rather than an instantaneous single-frame collapse into the 5% baseline rate.

#### Scenario: Player moves with directional keys
- **WHEN** the player presses and holds WASD keys to move
- **THEN** the time scale ramps with immediate attack up to 100% as the player reaches maximum movement speed

#### Scenario: Player releases directional keys
- **WHEN** the player releases active movement keys
- **THEN** the player decelerates and the time scale glides smoothly down along an asymmetric settling decay curve into the 5% baseline rate rather than dropping in a single frame
