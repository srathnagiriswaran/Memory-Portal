import { adminDb } from "./src/lib/firebase-admin";

async function seedMillerFamilyDemo() {
  const familyId = "demo@memoryportal.com"; // Set this to the email you log in with
  const caretakerName = "David Miller";

  console.log("Seeding Miller Family Demo Data...");

  // 1. Set Patient Profile
  await adminDb.collection("settings").doc(`patient_profile_${familyId}`).set({
    name: "Thomas",
    familyId: familyId
  });

  // 2. Seed Family Graph
  const familyMembers = [
    { name: "Thomas", relationship: "Self (The Loved One)", details: "Thomas Miller, 82 years old. Retired master mechanic who ran his own shop for 35 years. Grew up in Vermont. Married Martha for 52 years. Father of David and Sarah. Grandfather of Jake and Emily. Known for his patience, his apple pie, and his love of American muscle cars. The lake cabin on Lake Champlain, Vermont is his most treasured place.", familyId },
    { name: "Martha", relationship: "Wife", details: "Thomas's wife of 52 years. Mother of David and Sarah. She loves tending her vegetable garden every morning and makes famous sun tea in a big glass jar on the porch railing. Her laugh is Thomas's favorite sound. She named their Golden Retriever Buster. She is warm, funny, and finds great humor in everyday moments.", familyId },
    { name: "David", relationship: "Son", details: "Thomas and Martha's son. Age 58. Software engineer. He uploads the photos and records voice notes. He was 7 at the 1975 Cape Cod family beach trip and 12 when Thomas taught him to fish at the lake cabin in 1990. Sat on the concrete next to Thomas every Saturday in 1982 while Thomas worked on the Mustang. Father of Jake. Says Thomas's patience lesson guides him through difficult moments in adult life.", familyId },
    { name: "Sarah", relationship: "Daughter", details: "Thomas and Martha's daughter. David's younger sister. Age 55. Owns Miller's Sweet Corner bakery on Main Street. Learned to bake from Thomas on Thanksgiving 1998, still uses his exact recipe: 2 teaspoons cinnamon, 1 teaspoon nutmeg, squeeze of lemon. The pie sells out by 9 AM daily with a card reading Grandpa Thomas's Apple Pie, A Family Recipe Since 1965. Mother of Emily.", familyId },
    { name: "Jake", relationship: "Grandson", details: "David's 17-year-old son. Thomas's grandson. Rebuilding a 1972 Chevelle inspired by Thomas's 1968 Mustang. Borrowed Thomas's heavy silver wrenches from the red toolbox, saying they are the only tools that feel right. Has a photo of Thomas's Mustang on his garage wall as his inspiration board. Wants to be a master mechanic like his grandfather.", familyId },
    { name: "Emily", relationship: "Granddaughter", details: "Sarah's 10-year-old daughter. Thomas's granddaughter. Star pitcher, won the State Championship 4-1 with 6 strikeouts. When nervous on the mound, she closes her eyes and hears Thomas's voice telling her to plant her back foot and trust her arm. Her first call after winning was to Thomas. She calls him her good luck charm.", familyId },
    { name: "Buster", relationship: "Family Dog", details: "Martha's 8-year-old Golden Retriever. Joined the family as a puppy in 2018. Named by Martha for his mischievous face. As a puppy, chewed through Thomas's favorite brown leather slippers while Thomas secretly snuck him treats. Now famously lazy — has claimed the center of the living room rug as his territory and when asked to move sighs dramatically and shifts exactly two inches to the left.", familyId }
  ];
  
  // Clear old family graph
  const oldGraph = await adminDb.collection("family_graph").where("familyId", "==", familyId).get();
  for (const doc of oldGraph.docs) {
    await doc.ref.delete();
  }

  for (const member of familyMembers) {
    await adminDb.collection("family_graph").add(member);
  }

  // 3. Seed Memories (10 Photos with Deep Context)
  const memories = [
    {
      id: "photo_1_dance",
      photoUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      transcription: "Dad, this is our big family beach trip to Cape Cod in the summer of 1975. That was the trip where you and Mom surprised everyone by renting that big beach house for a whole week. You grilled burgers every single night. Mom made her famous sun tea in a giant glass jar on the porch railing and we drank it all before noon. You always said those summers were the best years of your life.",
      learnedFacts: [
        "Thomas loves big family gatherings and feels most himself when surrounded by his whole family.",
        "The annual Cape Cod beach trip is one of his most treasured memories.",
        "Thomas loves to grill and was the family BBQ master.",
        "Martha's famous sun tea, made in a big glass jar in the sun, is a specific and happy sensory memory.",
        "Thomas has always been the one who made big surprises happen for the family."
      ]
    },
    {
      id: "photo_2_mustang",
      photoUrl: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      transcription: "Dad, this is you in the driveway in the summer of 1982 working on that cherry-red 1968 Ford Mustang Fastback. You spent every Saturday that whole summer on that car. I remember sitting on the concrete next to you, handing you tools, and you would quiz me on the names of every single part. The red metal toolbox is still in the garage. Those heavy silver wrenches, the ones with the black grip handles, you always kept them on the top tray.",
      learnedFacts: [
        "Thomas's 1968 cherry-red Ford Mustang Fastback is a source of immense pride and joy.",
        "He spent every Saturday in summer 1982 restoring it, showing deep dedication.",
        "He loves teaching and used the car to teach David the names of every engine part.",
        "The red metal toolbox with silver wrenches with black grip handles is a highly specific, vivid memory.",
        "Thomas is a meticulous, methodical person who takes great care of his tools."
      ]
    },
    {
      id: "photo_3_fishing",
      photoUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      transcription: "Dad, this is you and me on the wooden dock at the lake cabin in the summer of 1990. I was twelve. I kept getting my line tangled in the reeds and I got so frustrated I almost threw the rod in the water. But you just laughed and untangled it for the fourth time without a single complaint. You told me that fishing was not about catching fish. You said it was about learning how to be still. I think about that every time life gets too loud.",
      learnedFacts: [
        "The Miller family lake cabin dock is a deeply symbolic place for Thomas and David.",
        "Thomas's life philosophy is about stillness and patience — he passed this to his son David.",
        "David specifically remembers this lesson as a guiding principle in his adult life.",
        "Thomas has always been patient and never made his kids feel bad for struggling.",
        "Thomas has a gentle, philosophical way of teaching life lessons through everyday moments."
      ]
    },
    {
      id: "photo_4_baking",
      photoUrl: "https://images.unsplash.com/photo-1587241321921-91a834d6d191?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      transcription: "Dad, this is you and Sarah on Thanksgiving 1998, baking your famous lattice-top apple pie. Sarah was so determined to get the lattice right. She must have re-done it three times. You never rushed her. You told her that the secret ingredient in any good pie is not the cinnamon, it is the patience. She was covered in flour from her hair to her elbows and she was absolutely beaming. She still uses your exact recipe. Two teaspoons of cinnamon, one of nutmeg, and a squeeze of lemon.",
      learnedFacts: [
        "Thomas's apple pie is a lattice-top with a very specific recipe: 2 teaspoons cinnamon, 1 teaspoon nutmeg, and a squeeze of lemon.",
        "Baking together, especially on Thanksgiving, is one of Thomas's most cherished family rituals.",
        "He taught Sarah that patience is the secret ingredient in baking and in life.",
        "Thomas never rushes his children and always lets them learn at their own pace.",
        "He has a lovely habit of turning practical lessons into life lessons."
      ]
    },
    {
      id: "photo_5_puppy",
      photoUrl: "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      transcription: "Dad, this is Buster when we first brought him home as a puppy in 2018! He was so tiny he could barely climb the porch steps. He would just sit at the bottom and whine until someone carried him up. Mom named him Buster because she said he had a look on his face like he was about to cause trouble. She was completely right. He chewed through your favorite brown leather slippers that first week. You pretended to be mad but we all saw you sneaking him treats from the kitchen.",
      learnedFacts: [
        "Buster the Golden Retriever joined the family in 2018 as a tiny puppy.",
        "Martha named him Buster because of his mischievous expression.",
        "As a puppy, Buster chewed through Thomas's favorite brown leather slippers.",
        "Thomas pretended to be stern but secretly adored Buster from day one.",
        "The image of little Buster unable to climb the porch steps is a funny, warm family memory."
      ]
    },
    {
      id: "photo_6_jake_car",
      photoUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      transcription: "Dad, look at Jake! He turned 17 last month and has been rebuilding a 1972 Chevelle in our garage for the past six months. The very first thing he did was come to your house to ask if he could borrow your silver wrenches from the red toolbox. He said, and I quote: 'Grandpa's tools are the only ones that feel right.' He has a photo of your Mustang taped up on the garage wall right next to where he works. He calls it his inspiration board.",
      learnedFacts: [
        "Jake is rebuilding a 1972 Chevelle, directly inspired by Thomas's 1968 Mustang restoration.",
        "Jake specifically sought out Thomas's silver wrenches, saying they are the only ones that feel right.",
        "Jake has a photo of Thomas's Mustang on his garage wall as his 'inspiration board'.",
        "The mechanic legacy is being actively and consciously passed from Thomas to Jake.",
        "Thomas is Jake's hero and role model, making Thomas feel a profound sense of purpose and legacy."
      ]
    },
    {
      id: "photo_7_bakery",
      photoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      transcription: "Dad, this is the front window of Sarah's bakery, Miller's Sweet Corner, on Main Street downtown. Do you see that apple pie right in the center of the display? That is your exact recipe. She sells out of it by 9 AM every single morning. She put a little handwritten card next to it that says 'Grandpa Thomas's Apple Pie — A Family Recipe Since 1965.' People drive across town for it. You started something, Dad. You really did.",
      learnedFacts: [
        "Sarah's bakery is called 'Miller's Sweet Corner' and it is on Main Street.",
        "Thomas's apple pie sells out by 9 AM every morning.",
        "Sarah made a handwritten card for the pie that says 'Grandpa Thomas's Apple Pie — A Family Recipe Since 1965.'",
        "People drive across town specifically for the pie.",
        "Thomas's simple act of baking with his daughter has become a community institution, which is deeply moving to him."
      ]
    },
    {
      id: "photo_8_softball",
      photoUrl: "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      transcription: "Dad, this is Emily at her State Championship softball game last Saturday! She was the starting pitcher and her team won 4 to 1. She struck out six batters. After the game she ran straight to call you. She told me later that when she is nervous on the mound, she closes her eyes and remembers you telling her to plant her back foot and trust her arm. She said your voice in her head helps her feel calm. You are her good luck charm, Dad.",
      learnedFacts: [
        "Emily won the State Championship softball game, pitching a 4-1 victory with 6 strikeouts.",
        "When Emily is nervous on the mound, she hears Thomas's voice telling her to plant her back foot.",
        "After the game, Emily's very first call was to Thomas, not her friends.",
        "Thomas is Emily's good luck charm and source of confidence.",
        "Thomas's guidance has a direct, real-world impact on Emily's performance and mental strength."
      ]
    },
    {
      id: "photo_9_buster_old",
      photoUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      transcription: "Dad, this is Buster this morning! He is 8 years old now and he has perfected the art of doing absolutely nothing. He has claimed the exact center of the living room rug as his personal territory. Mom tried to move him this morning to vacuum and he looked up at her with one eye, sighed the most dramatic sigh you have ever heard, and then very slowly shifted about two inches to the left. That was his compromise. Mom laughed for five minutes straight.",
      learnedFacts: [
        "Buster has claimed the exact center of the living room rug as his permanent spot.",
        "His response to being moved is a dramatic sigh and a two-inch shift — his 'compromise.'",
        "This story made Martha laugh for five minutes straight.",
        "Buster's lazy personality is a constant, gentle source of joy and humor in the household.",
        "Thomas loves hearing small, funny daily stories about what is happening at home."
      ]
    },
    {
      id: "photo_10_dock_now",
      photoUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&q=80&w=800",
      status: "active", caretakerName, familyId,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      transcription: "Dad, this is us last month at the lake cabin. We are sitting on the same wooden dock you built with your own hands in 1988. You and Mom are here, and the whole family came up for the weekend. It was a perfect morning. The water was completely still. You and I had two cups of coffee before anyone else woke up. You pointed to the spot where you taught me to cast a line all those years ago. You said the reeds haven't moved an inch. Some things really do never change, Dad. And I am so grateful for that.",
      learnedFacts: [
        "Thomas built the lake cabin dock with his own hands in 1988 — it is a physical legacy.",
        "The whole family gathered at the lake cabin last month for a weekend trip.",
        "Thomas and David had a quiet, private coffee together before anyone else woke up.",
        "Thomas pointed out the exact spot where he taught David to fish, showing his sharp, happy long-term memory.",
        "The unchanging lake is a powerful metaphor for the stability and permanence of the family's love."
      ]
    }
  ];

  // Clear old memories
  const oldMemories = await adminDb.collection("memories").where("familyId", "==", familyId).get();
  for (const doc of oldMemories.docs) {
    await doc.ref.delete();
  }

  for (const memory of memories) {
    // We use the 'id' field to force the document ID so the AI can cleanly call `changePhoto`
    const { id, ...data } = memory;
    await adminDb.collection("memories").doc(id).set(data);
  }

  // 4. Seed Harvested Memories (To populate the Studio Insights Dashboard)
  const harvested = [
    {
      familyId: familyId,
      caretakerName: "David Miller",
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      status: "verified",
      photoId: "photo_3_fishing",
      emotionalSummary: "Thomas was warm, reflective, and deeply sentimental today. He spoke slowly but with great clarity about teaching David to fish, saying it was one of his proudest moments as a father.",
      facts: [
        "Thomas remembers that day at the lake as one of his proudest fathering moments.",
        "He said the smell of pine and lake water is his favorite smell in the world.",
        "He mentioned wanting to go back to the cabin before winter."
      ]
    },
    {
      familyId: familyId,
      caretakerName: "David Miller",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
      status: "verified",
      photoId: "photo_2_mustang",
      emotionalSummary: "Thomas was incredibly energetic and sharp today. His eyes lit up talking about the Mustang. He remembered specific torque specs and the name of the auto parts store he used to drive to every Saturday morning.",
      facts: [
        "Thomas specifically asked if anyone is taking care of his old red toolbox.",
        "He laughed out loud remembering the sound of a cold V8 engine turning over on a winter morning.",
        "He vividly remembers Martha bringing him a grilled cheese sandwich while he worked in the driveway.",
        "He wants to know if Jake has found a good parts supplier for the Chevelle."
      ]
    },
    {
      familyId: familyId,
      caretakerName: "Sarah Miller",
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      status: "verified",
      photoId: "photo_7_bakery",
      emotionalSummary: "Thomas got very emotional today — in a beautiful way. He went quiet for a moment when he heard people drive across town for his pie recipe. He said quietly, 'I didn't know anyone remembered.'",
      facts: [
        "Thomas said quietly 'I didn't know anyone remembered' when he heard about the pie's success.",
        "He reminded Sarah to never skip the lemon squeeze — he says it brightens the whole flavor.",
        "He mentioned his own mother taught him the recipe and that it goes back at least three generations.",
        "He suggested Sarah try a peach and ginger version for the summer menu."
      ]
    },
    {
      familyId: familyId,
      caretakerName: "David Miller",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "verified",
      photoId: "photo_9_buster_old",
      emotionalSummary: "Thomas was in a great mood today, laughing the whole session. The story about Buster's dramatic two-inch compromise had him in genuine, joyful tears. He said it was the funniest thing he had heard all week.",
      facts: [
        "Thomas found the Buster compromise story absolutely hilarious and asked to hear it twice.",
        "He said Martha has always had a talent for finding the humor in everyday moments.",
        "He asked if Buster still sleeps with his paw over his nose, which he used to do as a puppy.",
        "He wants someone to bring Buster to visit him soon."
      ]
    },
    {
      familyId: familyId,
      caretakerName: "David Miller",
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: "verified",
      photoId: "photo_10_dock_now",
      emotionalSummary: "Thomas was calm, peaceful, and deeply content today. He held onto the lake cabin memory for a long time. He said the cabin is the place where he feels most like himself.",
      facts: [
        "Thomas said the lake cabin is the place where he feels most like himself.",
        "He specifically remembers building the dock in 1988 and how long it took him to get the first post level.",
        "He said his favorite thing in the world is drinking black coffee on the dock before anyone else wakes up.",
        "He expressed deep gratitude that the whole family came up last month and said it made him feel whole."
      ]
    }
  ];

  const oldHarvests = await adminDb.collection("harvested_memories").where("familyId", "==", familyId).get();
  for (const doc of oldHarvests.docs) {
    await doc.ref.delete();
  }

  for (const harvest of harvested) {
    await adminDb.collection("harvested_memories").add(harvest);
  }

  console.log("Miller Family Storyline successfully seeded!");
}

seedMillerFamilyDemo().catch(console.error);
