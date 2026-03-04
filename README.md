# Verse Surf Playlist Editor
Playlist editor for Verse Surf game built on Vue SPA and node.

Use this app to create and edit custom playlists for the Verse Surf music lyrics party game.

## Home Page 
- presentation of editor
- ability to create a new playlist
- ability to import a playlist from json
- ability to import a public playlist from spotify URL

## Playlist page 
- list existing songs and perform CRUD operations on songs
- ability to import track from spotify URL
- ability to choose playlist cover image from one of the songs
- ability to export playlist as json

## Song page
- ability to edit snippet
- ability to choose start and end seconds for song, while automatically setting 5 seconds between them by defaults
- ability to simulate the round as in the Verse Surf game:
  1. Middle text says "Listen to this" as the song preview plays from StartSecond to EndSecond
  2. The snippet appears in the middle text with ____ instead of {snippet words} as in the game
  3. User can press a button to move to next phase or re-edit the snippet and start the round again
  4. If next phase is chosen, the snippet answer is revealed while the music unpauses but slowly fades out:
  ```csharp
          public static async Task FadeOut(this AudioSource audioSource)
        {
            while (audioSource.isPlaying && audioSource.volume > 0f)
            {
                await new WaitForSeconds(1);
                if (audioSource.volume < 0.1f || audioSource.volume.IsEqualTo(0.1f))
                {
                    audioSource.volume -= 0.025f;
                }
                else
                {
                    audioSource.volume -= 0.1f;
                }
            }
        }
  ```
  5. Snippet quality validation:
      - low score if snippet answer is contained in the title of the song
      - low score if snippet answer is shorter than 4 letters

  Future plans:
  ## Song page
  - integrate with hugging face for whisper song preview
  - integrate with hugging face for snippet suggestions
  - Steam login and playlist saving server-side (firebase/supabase) with direct integration into the game itself (Community Playlists)
  - Playlist popularity & votes
