SET transaction_timeout = 0;
SET check_function_bodies = false;
CREATE TABLE public.playlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    enabled boolean NOT NULL,
    picture_url character varying,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.plays (
    id bigint NOT NULL,
    playlist_id uuid NOT NULL,
    played_at timestamp with time zone DEFAULT now() NOT NULL,
    played_by uuid NOT NULL
);
ALTER TABLE public.plays ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.plays_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    playlist_id uuid NOT NULL,
    reported_by uuid NOT NULL
);
CREATE TABLE public.songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    spotify_id character varying,
    title character varying,
    artist character varying,
    snippet text,
    start_second real DEFAULT '0'::real NOT NULL,
    end_second real DEFAULT '0'::real NOT NULL,
    is_explicit boolean DEFAULT false NOT NULL,
    preview_url character varying,
    picture_url character varying,
    enabled boolean DEFAULT false NOT NULL,
    playlist_id uuid NOT NULL
);
CREATE TABLE public.votes (
    id bigint NOT NULL,
    playlist_id uuid NOT NULL,
    vote smallint NOT NULL,
    voted_at timestamp with time zone DEFAULT now() NOT NULL,
    voted_by uuid NOT NULL
);
ALTER TABLE public.votes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.votes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.plays
    ADD CONSTRAINT plays_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.plays
    ADD CONSTRAINT plays_played_by_fkey FOREIGN KEY (played_by) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.plays
    ADD CONSTRAINT plays_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES auth.users(id);
ALTER TABLE ONLY public.songs
    ADD CONSTRAINT songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_voted_by_fkey FOREIGN KEY (voted_by) REFERENCES auth.users(id);
