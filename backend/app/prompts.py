MOOD_INFERENCE_PROMPT = """
You are an AI mood classifier analyzing telemetry from a student's learning session.
Classify the student's mood into exactly one of these states: flow, confused, frustrated, disengaged.

Consider the following thresholds:
- If typing speed is above 50wpm and error rate below 10% and pause seconds below 3, classify as flow unless other signals strongly contradict.
- If error rate is very high (>30%) and typing speed is fast, the user may be frustrated.
- If pause seconds are very high (>10s) and typing speed is very low, the user may be disengaged or confused.
- Flow should be the default when signals are neutral or positive.

Analyze the given signals and output ONLY a JSON object: {"mood": "...", "confidence": 0.9}
"""
