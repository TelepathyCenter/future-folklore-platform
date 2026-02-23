export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      call_rsvps: {
        Row: {
          call_id: string;
          created_at: string;
          id: string;
          profile_id: string;
          status: Database['public']['Enums']['rsvp_status'];
          updated_at: string;
        };
        Insert: {
          call_id: string;
          created_at?: string;
          id?: string;
          profile_id: string;
          status?: Database['public']['Enums']['rsvp_status'];
          updated_at?: string;
        };
        Update: {
          call_id?: string;
          created_at?: string;
          id?: string;
          profile_id?: string;
          status?: Database['public']['Enums']['rsvp_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'call_rsvps_call_id_fkey';
            columns: ['call_id'];
            isOneToOne: false;
            referencedRelation: 'calls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'call_rsvps_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      calls: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          duration_minutes: number;
          id: string;
          notes: string | null;
          project_id: string | null;
          scheduled_at: string;
          status: Database['public']['Enums']['call_status'];
          title: string;
          updated_at: string;
          video_link: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          project_id?: string | null;
          scheduled_at: string;
          status?: Database['public']['Enums']['call_status'];
          title: string;
          updated_at?: string;
          video_link?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          notes?: string | null;
          project_id?: string | null;
          scheduled_at?: string;
          status?: Database['public']['Enums']['call_status'];
          title?: string;
          updated_at?: string;
          video_link?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calls_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calls_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      concepts: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          is_canonical: boolean;
          name: string;
          parent_id: string | null;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          is_canonical?: boolean;
          name: string;
          parent_id?: string | null;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          is_canonical?: boolean;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'concepts_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'concepts_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'concepts';
            referencedColumns: ['id'];
          },
        ];
      };
      graph_edges: {
        Row: {
          created_at: string;
          created_by: string;
          edge_type: Database['public']['Enums']['edge_type'];
          id: string;
          notes: string | null;
          source_id: string;
          source_type: Database['public']['Enums']['node_type'];
          target_id: string;
          target_type: Database['public']['Enums']['node_type'];
          updated_at: string;
          weight: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          edge_type: Database['public']['Enums']['edge_type'];
          id?: string;
          notes?: string | null;
          source_id: string;
          source_type: Database['public']['Enums']['node_type'];
          target_id: string;
          target_type: Database['public']['Enums']['node_type'];
          updated_at?: string;
          weight?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          edge_type?: Database['public']['Enums']['edge_type'];
          id?: string;
          notes?: string | null;
          source_id?: string;
          source_type?: Database['public']['Enums']['node_type'];
          target_id?: string;
          target_type?: Database['public']['Enums']['node_type'];
          updated_at?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'graph_edges_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      memberships: {
        Row: {
          created_at: string;
          id: string;
          invited_by: string | null;
          joined_at: string;
          organization_id: string | null;
          profile_id: string;
          project_id: string | null;
          role: Database['public']['Enums']['membership_role'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string;
          organization_id?: string | null;
          profile_id: string;
          project_id?: string | null;
          role?: Database['public']['Enums']['membership_role'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invited_by?: string | null;
          joined_at?: string;
          organization_id?: string | null;
          profile_id?: string;
          project_id?: string | null;
          role?: Database['public']['Enums']['membership_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memberships_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          did: string | null;
          display_name: string | null;
          expertise_tags: string[];
          id: string;
          links: Json;
          role: Database['public']['Enums']['profile_role'];
          updated_at: string;
          username: string;
          visibility: Database['public']['Enums']['profile_visibility'];
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          did?: string | null;
          display_name?: string | null;
          expertise_tags?: string[];
          id: string;
          links?: Json;
          role?: Database['public']['Enums']['profile_role'];
          updated_at?: string;
          username: string;
          visibility?: Database['public']['Enums']['profile_visibility'];
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          did?: string | null;
          display_name?: string | null;
          expertise_tags?: string[];
          id?: string;
          links?: Json;
          role?: Database['public']['Enums']['profile_role'];
          updated_at?: string;
          username?: string;
          visibility?: Database['public']['Enums']['profile_visibility'];
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          anchor_chain: string | null;
          anchored_at: string | null;
          content_hash: string;
          created_at: string;
          created_by: string;
          description: string | null;
          evidence_url: string | null;
          hash_algorithm: string;
          id: string;
          project_id: string;
          proof_tx: string | null;
          status: Database['public']['Enums']['milestone_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          anchor_chain?: string | null;
          anchored_at?: string | null;
          content_hash: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          evidence_url?: string | null;
          hash_algorithm?: string;
          id?: string;
          project_id: string;
          proof_tx?: string | null;
          status?: Database['public']['Enums']['milestone_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          anchor_chain?: string | null;
          anchored_at?: string | null;
          content_hash?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          evidence_url?: string | null;
          hash_algorithm?: string;
          id?: string;
          project_id?: string;
          proof_tx?: string | null;
          status?: Database['public']['Enums']['milestone_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'project_milestones_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_milestones_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          domain_tags: string[];
          id: string;
          links: Json;
          name: string;
          organization_id: string;
          slug: string;
          status: Database['public']['Enums']['project_status'];
          updated_at: string;
          visibility: Database['public']['Enums']['project_visibility'];
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          domain_tags?: string[];
          id?: string;
          links?: Json;
          name: string;
          organization_id: string;
          slug: string;
          status?: Database['public']['Enums']['project_status'];
          updated_at?: string;
          visibility?: Database['public']['Enums']['project_visibility'];
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          domain_tags?: string[];
          id?: string;
          links?: Json;
          name?: string;
          organization_id?: string;
          slug?: string;
          status?: Database['public']['Enums']['project_status'];
          updated_at?: string;
          visibility?: Database['public']['Enums']['project_visibility'];
        };
        Relationships: [
          {
            foreignKeyName: 'projects_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'projects_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      call_status: 'scheduled' | 'live' | 'completed' | 'cancelled';
      edge_type:
        | 'works_on'
        | 'member_of'
        | 'interested_in'
        | 'expert_in'
        | 'mentors'
        | 'collaborates_with'
        | 'explores'
        | 'funded_by'
        | 'builds_on'
        | 'related_to'
        | 'subtopic_of'
        | 'related_concept'
        | 'discussed_in'
        | 'presented_at';
      membership_role: 'lead' | 'member' | 'advisor' | 'observer';
      milestone_status: 'recorded' | 'anchored' | 'verified';
      node_type: 'profile' | 'project' | 'organization' | 'concept' | 'call';
      profile_role:
        | 'researcher'
        | 'investor'
        | 'practitioner'
        | 'mentor'
        | 'observer';
      profile_visibility: 'public' | 'community' | 'private';
      project_status: 'active' | 'incubating' | 'paused' | 'completed';
      project_visibility: 'public' | 'community' | 'incubator';
      rsvp_status: 'going' | 'not_going' | 'maybe';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      call_status: ['scheduled', 'live', 'completed', 'cancelled'],
      edge_type: [
        'works_on',
        'member_of',
        'interested_in',
        'expert_in',
        'mentors',
        'collaborates_with',
        'explores',
        'funded_by',
        'builds_on',
        'related_to',
        'subtopic_of',
        'related_concept',
        'discussed_in',
        'presented_at',
      ],
      membership_role: ['lead', 'member', 'advisor', 'observer'],
      milestone_status: ['recorded', 'anchored', 'verified'],
      node_type: ['profile', 'project', 'organization', 'concept', 'call'],
      profile_role: [
        'researcher',
        'investor',
        'practitioner',
        'mentor',
        'observer',
      ],
      profile_visibility: ['public', 'community', 'private'],
      project_status: ['active', 'incubating', 'paused', 'completed'],
      project_visibility: ['public', 'community', 'incubator'],
      rsvp_status: ['going', 'not_going', 'maybe'],
    },
  },
} as const;
